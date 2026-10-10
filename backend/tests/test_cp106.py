"""
================================================================
  CP-106 -- Validación de Estado de Suspensión
  Prueba Unitaria: check_user_active + update_user_status
  Tipo: Unitaria | Nivel: Componente | Modalidad: Automatizada
  Responsable: Andy Calizaya
================================================================

Descripcion:
  Verificar que la función que suspende o reactiva un usuario actualice
  correctamente el campo is_active y que los intentos de login de
  usuarios suspendidos sean rechazados con el error BANNED_USER.

Ambiente:
  - Python 3.11+ / Pytest
  - Mock de base de datos (sin dependencia de PostgreSQL real)
  - Se testean las funciones check_user_active (AuthService) y
    update_user_status (AdminService)
"""

import sys
import os
import time
import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.auth_service import AuthService
from services.admin_service import AdminService
from fastapi import HTTPException


# --- Fixtures ---------------------------------------------------------

@pytest.fixture
def auth_service():
    """Instancia limpia del AuthService para cada test."""
    return AuthService()


@pytest.fixture
def admin_service():
    """Instancia limpia del AdminService para cada test."""
    return AdminService()


@pytest.fixture
def mock_db():
    """Mock de la sesión de base de datos (SQLAlchemy Session)."""
    return MagicMock()


@pytest.fixture
def active_user():
    """Mock de un usuario activo (is_active=True)."""
    user = MagicMock()
    user.id = uuid4()
    user.email = "estudiante@virtual.upt.pe"
    user.name = "Estudiante Activo"
    user.avatar_url = None
    user.role = MagicMock()
    user.role.value = "student"
    user.is_active = True
    user.last_login = None
    return user


@pytest.fixture
def suspended_user():
    """Mock de un usuario suspendido (is_active=False)."""
    user = MagicMock()
    user.id = uuid4()
    user.email = "suspendido@virtual.upt.pe"
    user.name = "Estudiante Suspendido"
    user.avatar_url = None
    user.role = MagicMock()
    user.role.value = "student"
    user.is_active = False
    user.last_login = None
    return user


# --- CASO 1: check_user_active con usuario activo --------------------

class TestUsuarioActivo:
    """Verifica que un usuario con is_active=True pase la verificación."""

    def test_usuario_activo_no_lanza_excepcion(self, auth_service, active_user):
        """CP-106.1: Un usuario activo NO debe ser rechazado por check_user_active."""
        start = time.perf_counter()
        # No debería lanzar ninguna excepción
        auth_service.check_user_active(active_user)
        elapsed_ms = (time.perf_counter() - start) * 1000

        print(f"  [OK] Usuario activo pasó la verificación sin error (latencia: {elapsed_ms:.1f}ms)")

    def test_usuario_none_no_lanza_excepcion(self, auth_service):
        """CP-106.2: Si user es None (nuevo registro), no debe lanzar excepción."""
        # Cuando un usuario es nuevo, get_user_by_email retorna None
        auth_service.check_user_active(None)
        print("  [OK] Usuario None (nuevo) pasó la verificación correctamente")


# --- CASO 2: check_user_active con usuario suspendido -----------------

class TestUsuarioSuspendido:
    """Verifica que un usuario con is_active=False sea rechazado con BANNED_USER."""

    def test_usuario_suspendido_lanza_banned_user(self, auth_service, suspended_user):
        """CP-106.3: Un usuario suspendido debe lanzar HTTP 403 con detalle BANNED_USER."""
        start = time.perf_counter()
        with pytest.raises(HTTPException) as exc_info:
            auth_service.check_user_active(suspended_user)
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert exc_info.value.status_code == 403, f"Esperado 403, obtenido {exc_info.value.status_code}"
        assert exc_info.value.detail == "BANNED_USER", f"Esperado 'BANNED_USER', obtenido '{exc_info.value.detail}'"
        print(f"  [OK] Usuario suspendido rechazado con 403 BANNED_USER (latencia: {elapsed_ms:.1f}ms)")


# --- CASO 3: Ciclo activo → suspendido → activo ----------------------

class TestCicloSuspension:
    """Verifica los ciclos de suspensión y reactivación."""

    def test_ciclo_activo_a_suspendido(self, admin_service, mock_db, active_user):
        """CP-106.4: Suspender un usuario activo debe actualizar is_active a False."""
        admin_id = uuid4()  # ID del administrador diferente al del usuario
        # Configurar el mock para que retorne el usuario al hacer query
        mock_db.query.return_value.filter.return_value.first.return_value = active_user

        result = admin_service.update_user_status(mock_db, str(active_user.id), False, admin_id)

        # Verificar que se actualizó el campo
        assert active_user.is_active == False, "is_active debería ser False después de suspender"
        mock_db.commit.assert_called_once()
        print("  [OK] Ciclo activo->suspendido: is_active actualizado a False correctamente")

    def test_ciclo_suspendido_a_activo(self, admin_service, mock_db, suspended_user):
        """CP-106.5: Reactivar un usuario suspendido debe actualizar is_active a True."""
        admin_id = uuid4()  # ID del administrador diferente al del usuario
        mock_db.query.return_value.filter.return_value.first.return_value = suspended_user

        result = admin_service.update_user_status(mock_db, str(suspended_user.id), True, admin_id)

        assert suspended_user.is_active == True, "is_active debería ser True después de reactivar"
        mock_db.commit.assert_called_once()
        print("  [OK] Ciclo suspendido->activo: is_active actualizado a True correctamente")

    def test_admin_no_puede_suspenderse_a_si_mismo(self, admin_service, mock_db, active_user):
        """CP-106.6: Un admin no puede cambiar su propio estado (protección anti-lockout)."""
        # Usar el mismo ID para admin y usuario
        mock_db.query.return_value.filter.return_value.first.return_value = active_user

        with pytest.raises(HTTPException) as exc_info:
            admin_service.update_user_status(mock_db, str(active_user.id), False, active_user.id)

        assert exc_info.value.status_code == 400
        assert "propio" in exc_info.value.detail.lower()
        print("  [OK] Admin no puede suspenderse a sí mismo (protección anti-lockout)")
