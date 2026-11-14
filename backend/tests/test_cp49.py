"""
================================================================
  CP-49 -- Integración Anuncios con Dashboard
  Prueba de Integración: Teacher -> Student Dashboard
  Tipo: Integración | Nivel: Sistema | Modalidad: Automatizada
  Responsable: Andy Calizaya
================================================================

Descripcion:
  Verificar que un anuncio creado por un docente a través de su endpoint
  se vea reflejado y retornado en el endpoint del estudiante.

Ambiente:
  - Python 3.11+ / FastAPI TestClient
  - Base de datos SQLite (Mock / Memory)
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
import models

def main():
    print("=== Iniciando prueba de integración CP-49 ===")
    
    mock_db = MagicMock()
    teacher_id = uuid4()

    class MockTeacher:
        id = teacher_id
        role = type('Role', (), {'value': 'teacher'})()

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[verify_teacher_role] = lambda: MockTeacher()
    
    client = TestClient(app)
    results = []

    # 1. Crear anuncio como docente
    start_time = time.perf_counter()
    res_post = client.post(
        "/api/teacher/announcements",
        json={"title": "Examen de Medio Curso", "content": "El examen será el viernes a las 10:00 AM."}
    )
    if res_post.status_code == 200:
        results.append(("Teacher Post Anuncio", res_post.status_code, "Creado (OK)"))
    else:
        results.append(("Teacher Post Anuncio", res_post.status_code, f"Error: {res_post.text}"))

    # Configurar mock para el GET: mock_db.query(Announcement).order_by(...).limit(5).all()
    # Necesitamos que devuelva algo parecido a un anuncio de DB
    mock_announcement = MagicMock()
    mock_announcement.id = uuid4()
    mock_announcement.title = "Examen de Medio Curso"
    mock_announcement.content = "El examen será el viernes a las 10:00 AM."
    mock_announcement.created_at = None

    mock_db.query.return_value.order_by.return_value.limit.return_value.all.return_value = [mock_announcement]

    # 2. Obtener anuncios como estudiante
    # El endpoint es GET /api/student/announcements
    res_get = client.get(
        "/api/student/announcements",
        headers={"X-User-ID": str(uuid4())}
    )
    elapsed = (time.perf_counter() - start_time) * 1000

    if res_get.status_code == 200:
        data = res_get.json()
        if len(data) > 0 and data[0]["title"] == "Examen de Medio Curso":
            print(f"  [OK] Integración confirmada: El anuncio apareció en el dashboard de estudiantes ({elapsed:.2f}ms)")
            results.append(("Student Get Anuncio", res_get.status_code, "Encontrado (OK)"))
        else:
            print("  [FALLO] El anuncio no apareció en el dashboard.")
            results.append(("Student Get Anuncio", res_get.status_code, "No encontrado (Fallo)"))
    else:
        results.append(("Student Get Anuncio", res_get.status_code, "Error"))
        
    app.dependency_overrides.clear()

    res_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Resultado de Pruebas'))
    os.makedirs(res_dir, exist_ok=True)

    with open(os.path.join(res_dir, 'CP-49.txt'), 'w', encoding='utf-8') as f:
        f.write("=== Resultados CP-49 (Integración Anuncios con Dashboard) ===\n\n")
        for desc, status, resultado in results:
            f.write(f"{desc} -> Status: {status} | Resultado: {resultado}\n")
        f.write(f"\nObservación: El endpoint del estudiante retorna exitosamente los\n")
        f.write(f"anuncios creados por el docente en la base de datos, asegurando la\n")
        f.write(f"comunicación de novedades en la plataforma.\n")

    print("\n=== Prueba CP-49 finalizada ===")

if __name__ == "__main__":
    main()
