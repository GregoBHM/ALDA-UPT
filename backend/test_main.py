from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
import uuid

# Importar la app y la base de datos
from main import app, verify_admin_role
from database import Base, get_db
import models

# --- Parche para soportar JSONB en SQLite ---
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"
# --------------------------------------------

# 1. Configurar una base de datos en memoria (SQLite) para testing aislando la real
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Crear las tablas de prueba
Base.metadata.create_all(bind=engine)

# 3. Sobrescribir la dependencia get_db para usar la base de datos de prueba
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# 4. Sobrescribir el validador de admin para los tests (Evita necesitar un usuario real)
def override_verify_admin_role():
    return models.DBUser(id=uuid.uuid4(), email="admin@virtual.upt.pe", name="Admin Test", role=models.UserRole.admin, is_active=True)

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[verify_admin_role] = override_verify_admin_role

client = TestClient(app)

def setup_function():
    # Limpiar tablas antes de cada test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

# -------------------------------------------------------------------
# PRUEBA CP-01: Validación de actualización de rol
# -------------------------------------------------------------------
def test_cp01_update_user_role():
    db = TestingSessionLocal()
    # 1. Crear un usuario de prueba en la BD (Estudiante por defecto)
    test_user_id = uuid.uuid4()
    test_user = models.DBUser(
        id=test_user_id,
        email="estudiante@virtual.upt.pe",
        name="Estudiante Prueba",
        role=models.UserRole.student,
        is_active=True,
        last_login=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(test_user)
    db.commit()
    db.close()

    # 2. Ejecutar la acción: El admin actualiza el rol a 'teacher'
    response = client.put(f"/api/admin/users/{test_user_id}/role", json={"role": "teacher"})
    
    # 3. Validar los resultados
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "teacher", "El rol no se actualizó correctamente en la respuesta de la API"

    # 4. Verificar en la base de datos que el cambio persistió
    db = TestingSessionLocal()
    updated_user = db.query(models.DBUser).filter(models.DBUser.id == test_user_id).first()
    assert updated_user.role.value == "teacher", "El rol no se actualizó correctamente en la base de datos (PostgreSQL/Mock)"
    db.close()
# -------------------------------------------------------------------
# PRUEBA CP-04: Persistencia de correo autorizado (Case-Insensitive)
# -------------------------------------------------------------------
def test_cp04_add_to_whitelist_case_insensitive():
    # 1. Enviar un correo con mayúsculas y minúsculas
    test_email = "UnCoRReO_ExTeRnO@gmail.com"
    test_note = "Profesor invitado"

    response = client.post("/api/admin/allowed-emails", json={
        "email": test_email,
        "note": test_note
    })

    # 2. Validar que la petición fue exitosa
    assert response.status_code == 200
    
    # 3. Validar que el correo se haya guardado y normalizado (en minúsculas)
    db = TestingSessionLocal()
    saved_email = db.query(models.AllowedEmail).filter(models.AllowedEmail.email == test_email.lower()).first()
    
    assert saved_email is not None, "El correo no se guardó en la lista blanca"
    assert saved_email.email == test_email.lower(), "El correo no se normalizó a minúsculas en la base de datos"
    assert saved_email.note == test_note, "La nota no se guardó correctamente"
    db.close()