"""
================================================================
  CP-01 -- Validacion de Dominio Institucional
  Prueba Unitaria: validate_email_eligibility (AuthService)
  Tipo: Unitaria | Nivel: Componente | Modalidad: Automatizada
  Responsable: Gregory Huanca
================================================================

Descripcion:
  Verificar que la funcion validate_email_eligibility del AuthService
  en el Backend acepte correos @virtual.upt.pe y rechace dominios
  externos lanzando una excepcion HTTP 403.

Ambiente:
  - Python 3.11+ / Pytest
  - Mock de base de datos (sin dependencia de PostgreSQL real)
  - Mock de API externa UPT (sin dependencia de red)
"""

import sys
import os
import time
import pytest
from unittest.mock import MagicMock, patch, Mock

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.auth_service import AuthService
from schemas.auth import UserLoginRequest
from fastapi import HTTPException


# --- Fixtures ---------------------------------------------------------

@pytest.fixture
def auth_service():
    """Instancia limpia del AuthService para cada test."""
    return AuthService()


@pytest.fixture
def mock_db():
    """Mock de la sesion de base de datos (SQLAlchemy Session)."""
    db = MagicMock()
    # Por defecto: el email NO esta en la whitelist
    db.query.return_value.filter.return_value.first.return_value = None
    return db



# --- CASO 1: Correo institucional @virtual.upt.pe --------------------

class TestCorreoInstitucional:
    """Verifica que correos @virtual.upt.pe sean aceptados."""

    @patch('urllib.request.urlopen')
    def test_correo_institucional_valido_acepta(self, mock_urlopen, auth_service, mock_db):
        """CP-01.1: Un correo @virtual.upt.pe valido debe retornar True."""
        # Mock: la API externa responde 200 (estudiante verificado)
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        auth_data = UserLoginRequest(
            email="2021069027@virtual.upt.pe",
            name="Estudiante UPT",
            avatar_url=None
        )

        start = time.perf_counter()
        result = auth_service.validate_email_eligibility(mock_db, auth_data)
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert result is True, "El correo institucional debio ser aceptado"
        print(f"  [OK] Correo institucional aceptado correctamente (latencia: {elapsed_ms:.1f}ms)")

    @patch('urllib.request.urlopen')
    def test_correo_institucional_minusculas(self, mock_urlopen, auth_service, mock_db):
        """CP-01.2: Validacion debe ser case-insensitive en el dominio."""
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        auth_data = UserLoginRequest(
            email="2021069027@VIRTUAL.UPT.PE",
            name="Estudiante UPT",
            avatar_url=None
        )

        result = auth_service.validate_email_eligibility(mock_db, auth_data)
        assert result is True, "La validacion debe ser insensible a mayusculas"
        print("  [OK] Dominio en mayusculas aceptado (case-insensitive)")


# --- CASO 2: Correo externo NO autorizado -----------------------------

class TestCorreoExterno:
    """Verifica que correos NO institucionales sin whitelist sean rechazados con HTTP 403."""

    def test_correo_gmail_rechazado_403(self, auth_service, mock_db):
        """CP-01.3: Un correo @gmail.com sin whitelist debe lanzar HTTP 403."""
        auth_data = UserLoginRequest(
            email="usuario@gmail.com",
            name="Externo",
            avatar_url=None
        )

        start = time.perf_counter()
        with pytest.raises(HTTPException) as exc_info:
            auth_service.validate_email_eligibility(mock_db, auth_data)
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert exc_info.value.status_code == 403, f"Esperado 403, obtenido {exc_info.value.status_code}"
        assert "institucionales" in exc_info.value.detail.lower() or "autorizados" in exc_info.value.detail.lower()
        print(f"  [OK] Correo gmail.com rechazado con 403 (latencia: {elapsed_ms:.1f}ms)")
        print(f'     Mensaje: "{exc_info.value.detail}"')

    def test_correo_hotmail_rechazado_403(self, auth_service, mock_db):
        """CP-01.4: Un correo @hotmail.com debe ser rechazado con HTTP 403."""
        auth_data = UserLoginRequest(
            email="usuario@hotmail.com",
            name="Externo Hotmail",
            avatar_url=None
        )

        with pytest.raises(HTTPException) as exc_info:
            auth_service.validate_email_eligibility(mock_db, auth_data)

        assert exc_info.value.status_code == 403
        print("  [OK] Correo hotmail.com rechazado con 403")

    def test_correo_yahoo_rechazado_403(self, auth_service, mock_db):
        """CP-01.5: Un correo @yahoo.com debe ser rechazado con HTTP 403."""
        auth_data = UserLoginRequest(
            email="test@yahoo.com",
            name="Externo Yahoo",
            avatar_url=None
        )

        with pytest.raises(HTTPException) as exc_info:
            auth_service.validate_email_eligibility(mock_db, auth_data)

        assert exc_info.value.status_code == 403
        print("  [OK] Correo yahoo.com rechazado con 403")

    def test_correo_dominio_similar_rechazado(self, auth_service, mock_db):
        """CP-01.6: Un dominio similar pero no exacto (ej: virtual.upt.pe.fake.com) debe ser rechazado."""
        auth_data = UserLoginRequest(
            email="hacker@virtual.upt.pe.fake.com",
            name="Spoofed",
            avatar_url=None
        )

        with pytest.raises(HTTPException) as exc_info:
            auth_service.validate_email_eligibility(mock_db, auth_data)

        assert exc_info.value.status_code == 403
        print("  [OK] Dominio similar (spoofing) rechazado con 403")

    def test_correo_otro_dominio_universitario(self, auth_service, mock_db):
        """CP-01.7: Correo de otra universidad debe ser rechazado."""
        auth_data = UserLoginRequest(
            email="alumno@unsa.edu.pe",
            name="Otra Universidad",
            avatar_url=None
        )

        with pytest.raises(HTTPException) as exc_info:
            auth_service.validate_email_eligibility(mock_db, auth_data)

        assert exc_info.value.status_code == 403
        print("  [OK] Correo de otra universidad rechazado con 403")

