"""API de autenticación y administración con cuentas de prueba."""
import pytest

import models
from core.security import COOKIE_NAME
from routers import auth
from services.assistant_service import AssistantService


@pytest.fixture
def google_identity(monkeypatch):
    def set_identity(email, expected_token="qa-google-token"):
        def verify_token(token):
            assert token == expected_token
            return {"email": email, "name": "Cuenta OAuth QA", "avatar_url": None}

        monkeypatch.setattr(auth, "verify_google_access_token", verify_token)

    return set_identity


def test_cp04_cp09_integracion_login_con_token_y_dominio(api, users, google_identity):
    student = users["student"]
    google_identity(student.email)
    with api() as client:
        login = client.post("/api/auth/login", json={"google_access_token": "qa-google-token"})
        assert login.status_code == 200
        assert login.json()["user"]["id"] == str(student.id)
        assert COOKIE_NAME in login.cookies
        assert client.get("/api/auth/me").json()["id"] == str(student.id)

    google_identity("externo@example.test")
    with api() as client:
        login = client.post("/api/auth/login", json={"google_access_token": "qa-google-token"})
        assert login.status_code == 403
        assert COOKIE_NAME not in login.cookies


def test_cp09_registra_estudiante_institucional(api, db, google_identity):
    email = "nuevo@virtual.upt.pe"
    google_identity(email)
    with api() as client:
        login = client.post("/api/auth/login", json={"google_access_token": "qa-google-token"})
    assert login.status_code == 200
    assert login.json()["user"]["role"] == "student"
    assert db.query(models.DBUser).filter_by(email=email).one().name == "Cuenta OAuth QA"


@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("PUT", "/api/admin/users/{id}/role", {"role": "teacher"}),
        ("PUT", "/api/admin/users/{id}/status", {"is_active": False}),
        ("POST", "/api/admin/allowed-emails", {"email": "externo@example.test"}),
        ("POST", "/api/admin/settings", {"active_model": "gemini-2.5-flash"}),
    ],
    ids=["cp103", "cp108", "cp113", "cp118"],
)
def test_operaciones_admin_restringidas(api, users, method, path, payload):
    path = path.format(id=users["student"].id)
    for role in ("student", "teacher"):
        with api(users[role]) as client:
            assert client.request(method, path, json=payload).status_code == 403
    with api() as client:
        assert client.request(method, path, json=payload).status_code == 401


def test_cp104_rol_actualizado_en_api_y_permisos(api, users):
    student = users["student"]
    with api(student) as client, api(users["admin"]) as admin:
        assert client.get("/api/teacher/stats").status_code == 403
        result = admin.put(f"/api/admin/users/{student.id}/role", json={"role": "teacher"})
        assert result.status_code == 200
        assert result.json()["role"] == "teacher"
        assert client.get("/api/auth/me").json()["role"] == "teacher"
        assert client.get("/api/teacher/stats").status_code == 200


def test_cp109_suspension_durante_login_y_reactivacion(api, users, google_identity):
    student = users["student"]
    google_identity(student.email)
    path = f"/api/admin/users/{student.id}/status"
    payload = {"google_access_token": "qa-google-token"}
    with api(users["admin"]) as admin, api() as client:
        assert client.post("/api/auth/login", json=payload).status_code == 200
        blocked = admin.put(path, json={"is_active": False})
        assert blocked.status_code == 200
        assert blocked.json()["is_active"] is False
        rejected = client.post("/api/auth/login", json=payload)
        assert rejected.status_code == 403
        assert rejected.json()["detail"] == "BANNED_USER"
        assert client.get("/api/auth/me").status_code == 401
        assert admin.put(path, json={"is_active": True}).status_code == 200
        assert client.post("/api/auth/login", json=payload).status_code == 200


def test_cp114_alta_y_baja_en_lista_blanca_afecta_login(api, users, google_identity):
    email = "invitado@example.test"
    google_identity(email)
    payload = {"google_access_token": "qa-google-token"}
    with api(users["admin"]) as admin, api() as client:
        assert client.post("/api/auth/login", json=payload).status_code == 403
        created = admin.post("/api/admin/allowed-emails", json={"email": email.upper()})
        assert created.status_code == 200
        assert created.json()["email"] == email
        assert client.post("/api/auth/login", json=payload).status_code == 200
        assert admin.delete(f"/api/admin/allowed-emails/{email}").status_code == 200
        assert client.post("/api/auth/login", json=payload).status_code == 403


def test_cp119_configuracion_persistida_selecciona_proveedor_del_tutor(api, users, db):
    with api(users["admin"]) as admin:
        response = admin.post(
            "/api/admin/settings", json={"active_model": "gpt-qa", "openai_key": "clave-ficticia"}
        )
    assert response.status_code == 200
    model, key, is_openai = AssistantService()._resolve_provider(db)
    assert model == "gpt-qa"
    assert key == "clave-ficticia"
    assert is_openai is True


@pytest.mark.xfail(strict=True, raises=AssertionError, reason="El endpoint no valida el formato del correo.")
def test_cp111_lista_blanca_rechaza_correo_sin_formato(api, users):
    with api(users["admin"]) as admin:
        response = admin.post("/api/admin/allowed-emails", json={"email": "correo-invalido"})
    assert response.status_code in (400, 422)
