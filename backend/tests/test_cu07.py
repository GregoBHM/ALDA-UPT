"""CU-07 (CP-31 y CP-34): verificaciones sin claves ni servicios externos.

Ejecutar desde backend, tras instalar requirements.txt y pytest:
    python -m pytest tests/test_cu07.py -v

CP-31: unitarias reales sobre AssistantService con proveedor/modelo simulados.
CP-34: pruebas de integración de límites internos (servicio, ORM simulado y router).
NO reemplazan el end-to-end con PostgreSQL, Gemini, navegador y ChromaDB.
"""

import asyncio
import json
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest
from fastapi import HTTPException

import models
from schemas.student import AssistantRequest, ChatMessage
from services.assistant_service import AssistantService


@pytest.fixture
def service():
    return AssistantService()


@pytest.fixture
def solicitud():
    return AssistantRequest(
        messages=[ChatMessage(role="user", text="¿Por qué me da error?")],
        code='printsdsdsd("Hola Mundo")',
        language="python",
        terminal_output="NameError: name 'printsdsdsd' is not defined",
    )


def test_cp31_construye_contexto_codigo_consola_e_intencion(service, solicitud):
    contents, question = service._build_contents(
        solicitud.messages, solicitud.code, solicitud.language,
        solicitud.terminal_output, lab_context="[LABORATORIO ACTIVO]: Suma de 1 a N\n"
    )
    prompt = contents[-1]["parts"][0]["text"]
    assert contents[-1]["role"] == "user"
    assert question == "¿Por qué me da error?"
    for expected in (
        "Suma de 1 a N", "PYTHON", "printsdsdsd", "NameError",
        "¿Por qué me da error?", "CONTEXTO DE EJECUCIÓN",
    ):
        assert expected in prompt


@pytest.mark.parametrize("raw", [
    '{"text":"Revisa el nombre de la función","quick_replies":["¿Qué es NameError?"]}',
    '```json\n{"text":"Revisa el nombre de la función"}\n```',
    'Respuesta: {"text":"Revisa el nombre de la función"} final',
])
def test_cp31_interpreta_respuesta_json(service, raw):
    assert service._extract_json(raw)["text"] == "Revisa el nombre de la función"


def test_cp31_procesa_respuesta_simulada_sin_proveedor_real(service, solicitud, monkeypatch):
    provider = Mock(return_value=json.dumps({
        "text": "¿Qué función de Python permite mostrar texto en pantalla?",
        "quick_replies": ["¿Qué significa NameError?"],
        "interaction": None,
    }))
    monkeypatch.setattr(service, "_resolve_provider", lambda _db: ("gemini-2.5-flash", "fake-not-a-key", False))
    monkeypatch.setattr(service, "_get_lab_context", lambda _db, _id: "")
    monkeypatch.setattr(service, "_get_rag_context", lambda *_args: "")
    monkeypatch.setattr(service, "_call_gemini", provider)
    result = service.ask(Mock(), user_id="", req=solicitud)
    assert "¿Qué función" in result["reply"]
    assert result["quick_replies"] == ["¿Qué significa NameError?"]
    assert result["attempt_id"] is None
    provider.assert_called_once()


def test_cp31_rechaza_consulta_sin_mensajes(service):
    with pytest.raises(HTTPException) as err:
        service.ask(Mock(), user_id="", req=AssistantRequest(messages=[]))
    assert err.value.status_code == 400
    assert "al menos un mensaje" in err.value.detail


def test_cp31_manejo_respuesta_no_json_es_explicito(service, solicitud, monkeypatch):
    """El fallback es un texto sin sugerencias; NO certifica calidad socrática."""
    monkeypatch.setattr(service, "_resolve_provider", lambda _db: ("gemini-2.5-flash", "fake-not-a-key", False))
    monkeypatch.setattr(service, "_get_lab_context", lambda *_args: "")
    monkeypatch.setattr(service, "_get_rag_context", lambda *_args: "")
    monkeypatch.setattr(service, "_call_gemini", lambda *_args: "Revisa el nombre de la función.")
    result = service.ask(Mock(), user_id="", req=solicitud)
    assert result["reply"] == "Revisa el nombre de la función."
    assert result["quick_replies"] == []
    assert result["interaction"] is None


def _db_contexto(laboratory_id, title, hidden_marker):
    """La ORM devuelve datos simulados; no abre conexión a PostgreSQL."""
    lab = SimpleNamespace(title=title, description="Calcular suma", difficulty="easy")
    visible = SimpleNamespace(is_hidden=False, input_data="4", expected_output="10")
    hidden = SimpleNamespace(is_hidden=True, input_data=hidden_marker, expected_output="999")
    q_lab, q_cases = Mock(), Mock()
    q_lab.filter.return_value.first.return_value = lab
    q_cases.filter.return_value.all.return_value = [visible, hidden]
    db = Mock()
    db.query.side_effect = [q_lab, q_cases]
    return db


def test_cp34_contexto_recuperado_no_expone_casos_ocultos(service, solicitud):
    lab_id = str(uuid4())
    ctx = service._get_lab_context(_db_contexto(lab_id, "Suma QA", "SECRETO-OCULTO"), lab_id)
    assert "Suma QA" in ctx
    assert "Entrada: '4'" in ctx
    assert "SECRETO-OCULTO" not in ctx
    contents, _ = service._build_contents(solicitud.messages, solicitud.code,
                                           solicitud.language, solicitud.terminal_output,
                                           lab_context=ctx)
    prompt = contents[-1]["parts"][0]["text"]
    assert "Suma QA" in prompt
    assert "NameError" in prompt
    assert "printsdsdsd" in prompt


def test_cp34_laboratorios_aislados_en_peticion(service, solicitud):
    id_a, id_b = str(uuid4()), str(uuid4())
    ctx_a = service._get_lab_context(_db_contexto(id_a, "LABORATORIO_A", "OCULTO-A"), id_a)
    ctx_b = service._get_lab_context(_db_contexto(id_b, "LABORATORIO_B", "OCULTO-B"), id_b)
    prompt_a = service._build_contents(solicitud.messages, solicitud.code,
                                        solicitud.language, solicitud.terminal_output,
                                        lab_context=ctx_a)[0][-1]["parts"][0]["text"]
    prompt_b = service._build_contents(solicitud.messages, solicitud.code,
                                        solicitud.language, solicitud.terminal_output,
                                        lab_context=ctx_b)[0][-1]["parts"][0]["text"]
    assert "LABORATORIO_A" in prompt_a and "LABORATORIO_B" not in prompt_a
    assert "LABORATORIO_B" in prompt_b and "LABORATORIO_A" not in prompt_b


def test_cp34_router_entrega_respuesta_stream_simulada(solicitud, monkeypatch):
    """Prueba conexión del router real con la interfaz del servicio, no con Gemini."""
    from routers import student
    fake_id = uuid4()
    db = Mock()
    recorded = []

    def fake_stream(db_arg, user_id, request):
        recorded.append((db_arg, user_id, request))
        return iter([b"Primera pista. ", b"Revisa el error."])

    monkeypatch.setattr(student._assistant_service, "ask_stream", fake_stream)
    response = student.ask_assistant_stream(
        solicitud, user=SimpleNamespace(id=fake_id), db=db
    )

    async def read_stream():
        data = b""
        async for chunk in response.body_iterator:
            data += chunk
        return data

    result = asyncio.run(read_stream())
    assert result.decode("utf-8") == "Primera pista. Revisa el error."
    assert recorded[0][0] is db
    assert recorded[0][1] == str(fake_id)
    assert recorded[0][2] is solicitud