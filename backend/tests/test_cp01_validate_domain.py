"""CP-01 y CP-06 comprueban la misma regla de dominio institucional."""
from unittest.mock import Mock

import pytest
from fastapi import HTTPException

from schemas.auth import GoogleIdentity
from services.auth_service import AuthService


@pytest.mark.parametrize("email", ["qa@virtual.upt.pe", "qa@VIRTUAL.UPT.PE"])
def test_cp01_cp06_acepta_dominio_institucional(email, monkeypatch):
    monkeypatch.delenv("BOOTSTRAP_ADMIN_EMAIL", raising=False)
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = None
    identity = GoogleIdentity(email=email, name="Cuenta ficticia")
    assert AuthService().validate_email_eligibility(db, identity) is True


@pytest.mark.parametrize(
    "email",
    ["qa@gmail.com", "qa@hotmail.com", "qa@yahoo.com", "qa@virtual.upt.pe.example.test", "qa@otra.example.test"],
)
def test_cp01_cp06_rechaza_dominio_externo(email, monkeypatch):
    monkeypatch.delenv("BOOTSTRAP_ADMIN_EMAIL", raising=False)
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = None
    identity = GoogleIdentity(email=email, name="Cuenta ficticia")
    with pytest.raises(HTTPException) as error:
        AuthService().validate_email_eligibility(db, identity)
    assert error.value.status_code == 403
