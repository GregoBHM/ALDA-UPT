from fastapi import Header, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

import models
import database


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_admin_role(x_user_id: str = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Header X-User-ID faltante")
    try:
        user_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de UUID inválido")
    user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol admin")
    return user


def verify_teacher_role(x_user_id: str = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Header X-User-ID faltante")
    try:
        user_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de UUID inválido")
    user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.role.value not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol teacher o admin")
    return user


def get_setting(db: Session, key_name: str, default_val: str = "") -> str:
    setting = db.query(models.SystemSetting).filter_by(key=key_name).first()
    return setting.value if setting and setting.value else default_val
