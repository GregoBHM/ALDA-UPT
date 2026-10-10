"""
================================================================
  CP-101 -- Validación de Rol en Cambio
  Prueba Unitaria: AdminService.update_user_role
  Tipo: Unitaria | Nivel: Componente | Modalidad: Automatizada
  Responsable: Andy Calizaya
================================================================

Descripcion:
  Verificar que la función del backend que cambia el rol de un usuario 
  solo acepte los valores válidos (student, teacher, admin) y rechace 
  cualquier otro.

Ambiente:
  - Python 3.11+ / Pytest
  - Mock de base de datos
"""

import sys
import os
import time
import pytest
from unittest.mock import MagicMock
from uuid import uuid4

# Agregar el directorio backend al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.admin_service import AdminService
from fastapi import HTTPException

@pytest.fixture
def admin_service():
    return AdminService()

@pytest.fixture
def mock_db():
    return MagicMock()

class DummyRole:
    def __init__(self, val):
        self.value = val

class DummyUser:
    def __init__(self, user_id, role_str):
        self.id = user_id
        self.email = "prueba@virtual.upt.pe"
        self.name = "Usuario Prueba"
        self.avatar_url = ""
        self._role_str = role_str
        self.is_active = True
        self.last_login = None

    @property
    def role(self):
        return DummyRole(self._role_str)

    @role.setter
    def role(self, value):
        self._role_str = value

@pytest.fixture
def mock_user():
    return DummyUser(uuid4(), "student")

class TestValidacionRoles:
    """Verifica la validación de valores válidos e inválidos de rol."""

    @pytest.mark.parametrize("rol_valido", ["student", "teacher", "admin"])
    def test_roles_validos_aceptados(self, admin_service, mock_db, mock_user, rol_valido):
        """CP-101.1: Los valores válidos (student, teacher, admin) deben ser aceptados."""
        # Configurar mock para que retorne el usuario
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        start = time.perf_counter()
        # No debería lanzar excepción
        admin_service.update_user_role(mock_db, str(mock_user.id), rol_valido)
        elapsed_ms = (time.perf_counter() - start) * 1000
        
        # Comprobación de que el rol fue asignado al usuario
        assert mock_user.role.value == rol_valido
        print(f"  [OK] Rol válido '{rol_valido}' aceptado exitosamente ({elapsed_ms:.2f}ms)")

    @pytest.mark.parametrize("rol_invalido", ["director", "sudo", "guest", "", " "])
    def test_roles_invalidos_rechazados(self, admin_service, mock_db, mock_user, rol_invalido):
        """CP-101.2: Valores no definidos como válidos deben ser rechazados con HTTP 400."""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        start = time.perf_counter()
        with pytest.raises(HTTPException) as exc_info:
            admin_service.update_user_role(mock_db, str(mock_user.id), rol_invalido)
        elapsed_ms = (time.perf_counter() - start) * 1000
        
        assert exc_info.value.status_code == 400
        assert "Rol inválido" in exc_info.value.detail
        print(f"  [OK] Rol inválido '{rol_invalido}' rechazado con 400 Bad Request ({elapsed_ms:.2f}ms)")

