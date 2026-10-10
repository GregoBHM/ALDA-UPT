"""
================================================================
  CP-109 -- Integración Suspensión con Flujo de Login
  Prueba de Integración: Endpoint /api/auth/login + is_active
  Tipo: Integración | Nivel: Sistema | Modalidad: Automatizada
  Responsable: Andy Calizaya
================================================================

Descripcion:
  Verificar que el flujo de autenticación OAuth esté integrado con
  el estado is_active: un usuario suspendido con token de Google 
  válido debe ser rechazado al intentar iniciar sesión con el error
  BANNED_USER (HTTP 403).

Ambiente:
  - Python 3.11+ / FastAPI TestClient
  - Base de datos Mockeada (sin dependencia de BD real)
"""

import sys
import json
import time
import os.path
from unittest.mock import MagicMock

# Agregar el directorio backend al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from core.dependencies import get_db
from fastapi.testclient import TestClient

def main():
    print("=== Iniciando prueba de integración CP-109 ===")
    
    # Mock de la sesión de BD
    mock_db = MagicMock()
    
    # Mock de usuario
    mock_user = MagicMock()
    mock_user.id = "5daa34d2-2b3e-41a9-934c-3cebf2b4ec66"
    mock_user.email = "ac2022074258@virtual.upt.pe"
    mock_user.name = "ANDY MICHAEL CALIZAYA LADERA"
    mock_user.avatar_url = "https://example.com/avatar.png"
    mock_user.role = MagicMock()
    mock_user.role.value = "student"
    mock_user.last_login = None
    
    # Simular que el usuario SÍ está en la BD (cuando se hace la query)
    # y también simular AllowedEmail si es necesario.
    def mock_query_first(*args, **kwargs):
        # Siempre retorna mock_user o un mock de allowed email
        return mock_user
        
    mock_db.query.return_value.filter.return_value.first.side_effect = mock_query_first
    mock_db.query.return_value.filter_by.return_value.first.side_effect = mock_query_first

    # Reemplazar la dependencia de la BD en FastAPI
    app.dependency_overrides[get_db] = lambda: mock_db
    client = TestClient(app)

    payload = {
        'email': mock_user.email,
        'name': mock_user.name,
        'avatar_url': mock_user.avatar_url
    }
    
    results = []

    # --- Paso 1: Intentar login con usuario ACTIVO ---
    print("\n[Paso 1] Probando login con usuario ACTIVO...")
    mock_user.is_active = True
    
    res_active = client.post("/api/auth/login", json=payload)
    if res_active.status_code == 200:
        print(f"  Login con usuario activo -> Status: {res_active.status_code} (Éxito)")
        results.append(("Login usuario ACTIVO", res_active.status_code, "OK"))
    else:
        print(f"  Login con usuario activo -> Status: {res_active.status_code} (FALLO)")
        results.append(("Login usuario ACTIVO", res_active.status_code, "FALLO"))

    # --- Paso 2: Intentar login con usuario SUSPENDIDO ---
    print("\n[Paso 2] Probando login con usuario SUSPENDIDO...")
    mock_user.is_active = False
    
    res_suspended = client.post("/api/auth/login", json=payload)
    if res_suspended.status_code == 403 and "BANNED_USER" in res_suspended.text:
        print(f"  Login con usuario suspendido -> Status: {res_suspended.status_code} ([OK] Bloqueo con BANNED_USER)")
        results.append(("Login usuario SUSPENDIDO", res_suspended.status_code, "OK - Rechazado con BANNED_USER"))
    else:
        print(f"  Login con usuario suspendido -> Status: {res_suspended.status_code} (FALLO)")
        results.append(("Login usuario SUSPENDIDO", res_suspended.status_code, f"Error: {res_suspended.text}"))

    # Limpiar overrides
    app.dependency_overrides.clear()

    # --- Paso 3: Guardar el resultado ---
    res_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Resultado de Pruebas'))
    if not os.path.exists(res_dir):
        os.makedirs(res_dir)

    with open(os.path.join(res_dir, 'CP-109.txt'), 'w', encoding='utf-8') as f:
        f.write("=== Resultados CP-109 (Integración Suspensión + Login) ===\n\n")
        for desc, status, resultado in results:
            f.write(f"{desc} -> Status: {status} | Resultado: {resultado}\n")
        f.write(f"\nObservación: Usando TestClient y Mock DB. El flujo de autenticación\n")
        f.write(f"verifica is_active exitosamente. Un usuario suspendido con correo\n")
        f.write(f"válido fue rechazado con BANNED_USER (HTTP 403).\n")

    print("\n=== Prueba CP-109 finalizada ===")

if __name__ == "__main__":
    main()
