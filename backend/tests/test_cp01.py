"""CP-01 | Validación de Dominio — Prueba unitaria de ALDA-UPT.

Colocar en backend/tests/test_cp01.py y ejecutar desde backend:
    python -m pytest tests/test_cp01.py -v

La base de datos es simulada (Mock): ninguna prueba abre una conexión
real a PostgreSQL.  Se verifica que validate_email_eligibility acepte
correos @virtual.upt.pe y rechace dominios externos con HTTP 403.
"""

import sys
import os
import types
from unittest.mock import Mock, patch, MagicMock

import pytest

# ─── Stub de database para evitar conexión real a PostgreSQL ───────
# database.py ejecuta create_engine() al importarse, lo que falla sin
# pg8000.  Creamos un módulo falso con un Base stub antes de importar
# cualquier cosa que dependa de él.
if "database" not in sys.modules:
    from sqlalchemy.orm import declarative_base
    _fake_db = types.ModuleType("database")
    _fake_db.Base = declarative_base()
    _fake_db.get_db = lambda: None
    _fake_db.SessionLocal = None
    _fake_db.engine = None
    sys.modules["database"] = _fake_db

from fastapi import HTTPException
from schemas.auth import GoogleIdentity
from services.auth_service import AuthService


# ─── Fixtures ──────────────────────────────────────────────────────

@pytest.fixture
def auth_service():
    """Instancia limpia del servicio de autenticación."""
    return AuthService()


@pytest.fixture
def db_sin_whitelist():
    """Mock de DB donde AllowedEmail.query no encuentra nada."""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    return db


@pytest.fixture
def db_con_whitelist():
    """Mock de DB donde AllowedEmail.query encuentra un registro."""
    db = MagicMock()
    # Simula que el correo SÍ está en la lista blanca
    mock_allowed = Mock()
    mock_allowed.email = "externo@gmail.com"
    db.query.return_value.filter.return_value.first.return_value = mock_allowed
    return db


def _identity(email: str) -> GoogleIdentity:
    """Atajo para crear un GoogleIdentity de prueba."""
    return GoogleIdentity(email=email, name="Test User", avatar_url=None)


# ─── Tests ─────────────────────────────────────────────────────────

class TestValidateEmailEligibility:
    """CP-01: validate_email_eligibility acepta @virtual.upt.pe
    y rechaza dominios externos con HTTP 403."""

    # --- Casos positivos: correos que DEBEN ser aceptados ---

    def test_acepta_correo_institucional(self, auth_service, db_sin_whitelist):
        """Un correo @virtual.upt.pe debe ser aceptado."""
        resultado = auth_service.validate_email_eligibility(
            db_sin_whitelist, _identity("2021069266@virtual.upt.pe")
        )
        assert resultado is True

    def test_acepta_correo_institucional_mayusculas(self, auth_service, db_sin_whitelist):
        """La validación debe ser case-insensitive."""
        resultado = auth_service.validate_email_eligibility(
            db_sin_whitelist, _identity("2021069266@VIRTUAL.UPT.PE")
        )
        assert resultado is True

    def test_acepta_correo_en_lista_blanca(self, auth_service, db_con_whitelist):
        """Un correo externo que esté en AllowedEmail debe ser aceptado."""
        resultado = auth_service.validate_email_eligibility(
            db_con_whitelist, _identity("externo@gmail.com")
        )
        assert resultado is True

    @patch.dict(os.environ, {"BOOTSTRAP_ADMIN_EMAIL": "admin@empresa.com"})
    def test_acepta_bootstrap_admin(self, auth_service, db_sin_whitelist):
        """El correo del BOOTSTRAP_ADMIN_EMAIL siempre debe ser aceptado."""
        resultado = auth_service.validate_email_eligibility(
            db_sin_whitelist, _identity("admin@empresa.com")
        )
        assert resultado is True

    # --- Casos negativos: correos que DEBEN ser rechazados ---

    def test_rechaza_dominio_externo_gmail(self, auth_service, db_sin_whitelist):
        """Un correo @gmail.com sin whitelist debe lanzar HTTP 403."""
        with pytest.raises(HTTPException) as exc_info:
            auth_service.validate_email_eligibility(
                db_sin_whitelist, _identity("usuario@gmail.com")
            )
        assert exc_info.value.status_code == 403

    def test_rechaza_dominio_externo_hotmail(self, auth_service, db_sin_whitelist):
        """Un correo @hotmail.com sin whitelist debe lanzar HTTP 403."""
        with pytest.raises(HTTPException) as exc_info:
            auth_service.validate_email_eligibility(
                db_sin_whitelist, _identity("usuario@hotmail.com")
            )
        assert exc_info.value.status_code == 403

    def test_rechaza_dominio_similar_no_institucional(self, auth_service, db_sin_whitelist):
        """Un dominio parecido (virtual.upt.com) NO debe ser aceptado."""
        with pytest.raises(HTTPException) as exc_info:
            auth_service.validate_email_eligibility(
                db_sin_whitelist, _identity("alumno@virtual.upt.com")
            )
        assert exc_info.value.status_code == 403

    def test_mensaje_error_403_es_descriptivo(self, auth_service, db_sin_whitelist):
        """El mensaje del error 403 debe indicar que solo se permiten
        correos institucionales o autorizados."""
        with pytest.raises(HTTPException) as exc_info:
            auth_service.validate_email_eligibility(
                db_sin_whitelist, _identity("externo@yahoo.com")
            )
        assert exc_info.value.status_code == 403
        assert "institucionales" in exc_info.value.detail.lower() or \
               "autorizados" in exc_info.value.detail.lower()
