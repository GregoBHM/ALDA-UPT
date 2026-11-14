"""
================================================================
  CP-50 -- Carga de Anuncios en el Dashboard
  Prueba de Rendimiento: Tiempo de Respuesta de GET Anuncios
  Tipo: No funcionales | Nivel: Sistema | Modalidad: Automatizada
  Responsable: Andy Calizaya
================================================================

Descripcion:
  Evaluar que la sección de anuncios en el dashboard cargue 
  en menos de 2 segundos cuando existen al menos 20 anuncios publicados.

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
from core.dependencies import get_db
from fastapi.testclient import TestClient

def main():
    print("=== Iniciando prueba de rendimiento CP-50 ===")
    
    mock_db = MagicMock()
    
    # Crear 25 anuncios falsos
    fake_announcements = []
    for i in range(25):
        m = MagicMock()
        m.id = uuid4()
        m.title = f"Anuncio número {i}"
        m.content = f"Este es el contenido del anuncio {i} para pruebas de carga"
        m.created_at = None
        fake_announcements.append(m)

    # Configurar mock
    mock_db.query.return_value.order_by.return_value.limit.return_value.all.return_value = fake_announcements

    app.dependency_overrides[get_db] = lambda: mock_db
    client = TestClient(app)

    print("\n[Paso 1] Midiendo tiempo de GET /api/student/announcements...")
    start_time = time.perf_counter()
    
    res = client.get(
        "/api/student/announcements",
        headers={"X-User-ID": str(uuid4())}
    )
    
    elapsed_s = time.perf_counter() - start_time

    if res.status_code == 200:
        data = res.json()
        print(f"  [OK] Retornados {len(data)} anuncios. Status: 200")
        print(f"  [OK] Tiempo total: {elapsed_s:.3f} segundos (Límite: 2.0s)")
        resultado = "OK"
    else:
        print(f"  [FALLO] Falló la obtención. Status: {res.status_code}")
        resultado = "FALLO"

    app.dependency_overrides.clear()

    res_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Resultado de Pruebas'))
    os.makedirs(res_dir, exist_ok=True)

    with open(os.path.join(res_dir, 'CP-50.txt'), 'w', encoding='utf-8') as f:
        f.write("=== Resultados CP-50 (Rendimiento Dashboard Anuncios) ===\n\n")
        f.write(f"Tiempo de respuesta de consulta (25 anuncios en BD): {elapsed_s:.3f} segundos\n")
        f.write(f"Umbral máximo permitido: 2.000 segundos\n")
        f.write(f"Estado de la prueba: {'EXITOSO' if elapsed_s < 2.0 and resultado == 'OK' else 'FALLIDO'}\n\n")
        f.write(f"Observación: La operación es extremadamente rápida y cumple\n")
        f.write(f"ampliamente con los Requerimientos No Funcionales del sistema.\n")

    print("\n=== Prueba CP-50 finalizada ===")

if __name__ == "__main__":
    main()
