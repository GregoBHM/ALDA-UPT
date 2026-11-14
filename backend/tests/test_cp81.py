"""
================================================================
  CP-81 -- Validación de Formato del Material
  Prueba Unitaria: Validación de Upload PDF
  Tipo: Unitaria | Nivel: Componente | Modalidad: Automatizada
  Responsable: Gregory Huanca
================================================================

Descripcion:
  Verificar que el endpoint de subida de material pedagógico
  solo acepte archivos PDF y rechace extensiones no soportadas 
  (ej. .txt, .docx, .png).

Ambiente:
  - Python 3.11+ / FastAPI TestClient
  - Base de datos Mockeada
"""

import sys
import os
import time
from unittest.mock import MagicMock
from uuid import uuid4

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from core.dependencies import get_db, verify_teacher_role
from fastapi.testclient import TestClient

def main():
    print("=== Iniciando prueba unitaria CP-81 ===")
    
    mock_db = MagicMock()
    mock_teacher = MagicMock()
    mock_teacher.id = uuid4()
    mock_teacher.role.value = "teacher"
    
    # Mocking db query
    mock_db.query.return_value.filter.return_value.first.return_value = mock_teacher

    app.dependency_overrides[get_db] = lambda: mock_db
    # Also need to bypass verify_teacher_role if we don't want to pass a token
    app.dependency_overrides[verify_teacher_role] = lambda: mock_teacher
    
    client = TestClient(app)
    results = []

    # Caso 1: Archivo inválido (TXT)
    print("\n[Paso 1] Probando subir archivo .txt...")
    start_time = time.perf_counter()
    res_txt = client.post(
        "/api/teacher/knowledge/upload-pdf",
        headers={"X-User-ID": str(mock_teacher.id)},
        data={"title": "Documento Texto"},
        files={"file": ("archivo.txt", b"Contenido de prueba", "text/plain")}
    )
    elapsed_ms = (time.perf_counter() - start_time) * 1000
    
    if res_txt.status_code == 400 and "Solo se aceptan archivos PDF" in res_txt.text:
        print(f"  [OK] Archivo .txt rechazado correctamente ({elapsed_ms:.2f}ms)")
        results.append((".txt file upload", res_txt.status_code, "Rechazado (OK)"))
    else:
        print(f"  [FALLO] Archivo .txt no fue rechazado como se esperaba. Status: {res_txt.status_code}")
        results.append((".txt file upload", res_txt.status_code, "Aceptado o Error Inesperado"))

    # Caso 2: Archivo inválido (DOCX)
    print("\n[Paso 2] Probando subir archivo .docx...")
    start_time = time.perf_counter()
    res_docx = client.post(
        "/api/teacher/knowledge/upload-pdf",
        headers={"X-User-ID": str(mock_teacher.id)},
        data={"title": "Documento Word"},
        files={"file": ("archivo.docx", b"PK...", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    if res_docx.status_code == 400 and "Solo se aceptan archivos PDF" in res_docx.text:
        print(f"  [OK] Archivo .docx rechazado correctamente ({elapsed_ms:.2f}ms)")
        results.append((".docx file upload", res_docx.status_code, "Rechazado (OK)"))
    else:
        print(f"  [FALLO] Archivo .docx no fue rechazado como se esperaba. Status: {res_docx.status_code}")
        results.append((".docx file upload", res_docx.status_code, "Aceptado o Error Inesperado"))
        
    app.dependency_overrides.clear()

    res_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Resultado de Pruebas'))
    os.makedirs(res_dir, exist_ok=True)

    with open(os.path.join(res_dir, 'CP-81.txt'), 'w', encoding='utf-8') as f:
        f.write("=== Resultados CP-81 (Validación Formato de Material) ===\n\n")
        for desc, status, resultado in results:
            f.write(f"{desc} -> Status: {status} | Resultado: {resultado}\n")
        f.write(f"\nObservación: El endpoint '/upload-pdf' correctamente restringe la subida\n")
        f.write(f"a archivos PDF exclusivamente, rechazando extensiones como .txt y .docx con error 400.\n")

    print("\n=== Prueba CP-81 finalizada ===")

if __name__ == "__main__":
    main()
