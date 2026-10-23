"""CP-61 | CU-13: pruebas unitarias de creación de laboratorios en ALDA-UPT.

Colocar en backend/tests/test_cp61.py y ejecutar desde backend:
    python -m pytest tests/test_cp61.py -v

La base de datos es simulada: ninguna prueba abre una conexión a PostgreSQL.
Las dos pruebas de validación negativa pueden fallar en el código actual; ese
resultado debe registrarse como defecto, no ocultarse.
"""

from uuid import uuid4
from unittest.mock import Mock

import pytest
from pydantic import ValidationError

import models
from schemas.teacher import LabCreateRequest, TestCaseCreateRequest
from services.teacher_service import TeacherService


@pytest.fixture
def db_simulada():
    """Simula add/flush/commit sin conexión real a la base de datos."""
    db = Mock()

    def simular_flush():
        # SQLAlchemy normalmente asigna la clave UUID durante flush.
        laboratorio = db.add.call_args_list[0].args[0]
        laboratorio.id = uuid4()

    db.flush.side_effect = simular_flush
    return db


def solicitud_ejemplo(titulo="Prueba QA - Suma de dos números"):
    return LabCreateRequest(
        title=titulo,
        description="Leer dos números enteros y mostrar su suma.",
        difficulty="medium",
        is_exam=False,
        test_cases=[
            TestCaseCreateRequest(input_data="2 3", expected_output="5", is_hidden=False),
            TestCaseCreateRequest(input_data="10 20", expected_output="30", is_hidden=False),
            TestCaseCreateRequest(input_data="-5 8", expected_output="3", is_hidden=True),
        ],
    )


def test_cp61_crea_laboratorio_y_confirma_transaccion(db_simulada):
    docente_id = uuid4()
    resultado = TeacherService().create_lab(db_simulada, docente_id, solicitud_ejemplo())

    laboratorio = db_simulada.add.call_args_list[0].args[0]
    assert isinstance(laboratorio, models.Laboratory)
    assert laboratorio.title == "Prueba QA - Suma de dos números"
    assert laboratorio.teacher_id == docente_id
    assert laboratorio.difficulty == "medium"
    assert laboratorio.is_exam is False
    assert resultado == {
        "message": "Reto y casos de prueba creados",
        "id": str(laboratorio.id),
    }
    db_simulada.flush.assert_called_once_with()
    db_simulada.commit.assert_called_once_with()


def test_cp61_registra_tres_casos_y_uno_oculto(db_simulada):
    TeacherService().create_lab(db_simulada, uuid4(), solicitud_ejemplo())

    objetos = [llamada.args[0] for llamada in db_simulada.add.call_args_list]
    laboratorio, *casos = objetos
    assert len(casos) == 3
    assert all(isinstance(caso, models.TestCase) for caso in casos)
    assert all(caso.laboratory_id == laboratorio.id for caso in casos)
    assert [(caso.input_data, caso.expected_output) for caso in casos] == [
        ("2 3", "5"), ("10 20", "30"), ("-5 8", "3")
    ]
    assert [caso.is_hidden for caso in casos] == [False, False, True]
    assert all(caso.evaluation_type == "exact" for caso in casos)


def test_cp61_aplica_valores_predeterminados(db_simulada):
    solicitud = LabCreateRequest(
        title="Reto predeterminado",
        test_cases=[TestCaseCreateRequest(input_data="1", expected_output="2")],
    )
    TeacherService().create_lab(db_simulada, uuid4(), solicitud)
    laboratorio, caso = [x.args[0] for x in db_simulada.add.call_args_list]

    assert laboratorio.difficulty == "medium"
    assert laboratorio.is_exam is False
    assert caso.is_hidden is False
    assert caso.evaluation_type == "exact"


@pytest.mark.parametrize("titulo_invalido", ["", "   "])
def test_cp61_rechaza_titulo_vacio_o_espacios(titulo_invalido):
    """Requisito negativo: el backend debería rechazar títulos vacíos.

    Si falla, el esquema actual está admitiendo datos inválidos; es un hallazgo
    y requiere agregar una validación real antes de repetir la prueba.
    """
    with pytest.raises(ValidationError):
        solicitud_ejemplo(titulo=titulo_invalido)
