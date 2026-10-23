from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from uuid import UUID

import database
import models
from core.security import COOKIE_NAME, verify_session_token


_bearer = HTTPBearer(auto_error=False)


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
):
    token = credentials.credentials if credentials else request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Sesión requerida")

    user_id = verify_session_token(token)
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Sesión inválida")

    user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario inexistente o inactivo")
    return user


def verify_admin_role(user: models.DBUser = Depends(get_current_user)):
    if user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol admin")
    return user


def verify_teacher_role(user: models.DBUser = Depends(get_current_user)):
    if user.role.value not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol teacher o admin")
    return user


def get_setting(db: Session, key_name: str, default_val: str = "") -> str:
    setting = db.query(models.SystemSetting).filter_by(key=key_name).first()
    return setting.value if setting and setting.value else default_val
