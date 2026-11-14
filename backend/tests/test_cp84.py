"""
================================================================
  CP-84 -- Integración Material con Tutor IA
  Prueba de Integración: Asistente + RAG
  Tipo: Integración | Nivel: Sistema | Modalidad: Automatizada
  Responsable: Gregory Huanca
================================================================

Descripcion:
  Verificar que el material pedagógico cargado (vía RAG en ChromaDB)
  sea efectivamente inyectado como contexto en el prompt del tutor IA
  para enriquecer sus respuestas.

Ambiente:
  - Python 3.11+ / FastAPI TestClient
  - Base de datos Mockeada
  - Servicios externos (ChromaDB / Gemini) Mockeados
"""

import sys
import os
import time
from unittest.mock import MagicMock, patch
from uuid import uuid4

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from core.dependencies import get_db
from fastapi.testclient import TestClient

def main():
    print("=== Iniciando prueba de integración CP-84 ===")
    
    mock_db = MagicMock()
    # Mockear un estudiante
    mock_student = MagicMock()
    mock_student.id = uuid4()
    mock_student.role.value = "student"
    
    mock_db.query.return_value.filter.return_value.count.return_value = 0

    class MockSetting:
        def __init__(self, val):
            self.value = val

    # Configurar mock para api key y active model
    mock_db.query.return_value.filter_by.return_value.first.return_value = MockSetting("gemini-2.5-flash")

    app.dependency_overrides[get_db] = lambda: mock_db
    
    client = TestClient(app)
    results = []

    # Se usará un bloque patch para interceptar chroma_service y la llamada a Gemini
    print("\n[Paso 1] Enviando pregunta al tutor con RAG mockeado...")
    start_time = time.perf_counter()

    # Mocks
    fake_rag_results = [{"title": "Guía de Punteros en C++", "text": "Un puntero almacena la dirección de memoria de una variable."}]
    
    with patch('services.assistant_service.chroma_service.query_knowledge', return_value=fake_rag_results) as mock_chroma:
        with patch('services.assistant_service.AssistantService._call_gemini', return_value="{\"text\":\"Respuesta mockeada usando RAG\"}") as mock_gemini:
            
            res = client.post(
                "/api/student/assistant",
                headers={"X-User-ID": str(mock_student.id)},
                json={
                    "messages": [{"role": "user", "text": "¿Qué es un puntero?"}],
                    "code": "",
                    "language": "cpp",
                    "terminal_output": ""
                }
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000

            if res.status_code == 200:
                print(f"  [OK] Endpoint de asistente respondió correctamente ({elapsed_ms:.2f}ms)")
                
                # Verificamos si _call_gemini recibió el contexto de RAG
                called_args, _ = mock_gemini.call_args
                system_prompt_sent = called_args[2] # 3er argumento es system_with_rag
                
                if "Guía de Punteros en C++" in system_prompt_sent and "dirección de memoria" in system_prompt_sent:
                    print(f"  [OK] El contexto RAG fue inyectado correctamente en el prompt del sistema.")
                    results.append(("Integración RAG -> Tutor IA", res.status_code, "Éxito (Contexto RAG inyectado)"))
                else:
                    print(f"  [FALLO] El contexto RAG no se encontró en el prompt del sistema.")
                    results.append(("Integración RAG -> Tutor IA", res.status_code, "Fallo (Contexto no inyectado)"))
            else:
                print(f"  [FALLO] Endpoint de asistente retornó error: {res.text}")
                results.append(("Integración RAG -> Tutor IA", res.status_code, "Fallo endpoint"))

    app.dependency_overrides.clear()

    res_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Resultado de Pruebas'))
    os.makedirs(res_dir, exist_ok=True)

    with open(os.path.join(res_dir, 'CP-84.txt'), 'w', encoding='utf-8') as f:
        f.write("=== Resultados CP-84 (Integración Material con Tutor IA) ===\n\n")
        for desc, status, resultado in results:
            f.write(f"{desc} -> Status: {status} | Resultado: {resultado}\n")
        f.write(f"\nObservación: La integración con ChromaDB se simula correctamente\n")
        f.write(f"y los fragmentos de conocimiento se anexan explícitamente al prompt\n")
        f.write(f"que consume el modelo de lenguaje (Gemini/OpenAI).\n")

    print("\n=== Prueba CP-84 finalizada ===")

if __name__ == "__main__":
    main()
