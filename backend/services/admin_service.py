import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

import models


class AdminService:

    def get_all_users(self, db: Session) -> list:
        users = db.query(models.DBUser).all()
        return [
            {
                "id": str(u.id), "email": u.email, "name": u.name,
                "avatar_url": u.avatar_url, "role": u.role.value,
                "is_active": u.is_active, "last_login": u.last_login
            }
            for u in users
        ]

    def update_user_role(self, db: Session, user_id: str, role: str) -> dict:
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="UUID inválido")
        if role not in ["student", "teacher", "admin"]:
            raise HTTPException(status_code=400, detail="Rol inválido")
        user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user.role = role
        db.commit()
        db.refresh(user)
        return {
            "id": str(user.id), "email": user.email, "name": user.name,
            "avatar_url": user.avatar_url, "role": user.role.value,
            "is_active": user.is_active, "last_login": user.last_login
        }

    def update_user_status(self, db: Session, user_id: str, is_active: bool, admin_id) -> dict:
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="UUID inválido")
        user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if str(user.id) == str(admin_id):
            raise HTTPException(status_code=400, detail="No puedes cambiar tu propio estado")
        user.is_active = is_active
        db.commit()
        db.refresh(user)
        return {
            "id": str(user.id), "email": user.email, "name": user.name,
            "avatar_url": user.avatar_url, "role": user.role.value,
            "is_active": user.is_active, "last_login": user.last_login
        }

    def delete_user(self, db: Session, user_id: str, admin_id) -> dict:
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="UUID inválido")
        if str(user_uuid) == str(admin_id):
            raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo.")
        user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        db.delete(user)
        db.commit()
        return {"detail": "Usuario eliminado correctamente"}

    def get_allowed_emails(self, db: Session) -> list:
        entries = db.query(models.AllowedEmail).order_by(models.AllowedEmail.created_at.desc()).all()
        return [{"email": e.email, "note": e.note, "created_at": e.created_at} for e in entries]

    def add_allowed_email(self, db: Session, email: str, note: str, admin_id) -> dict:
        normalized_email = email.lower()
        existing = db.query(models.AllowedEmail).filter(models.AllowedEmail.email == normalized_email).first()
        if existing:
            raise HTTPException(status_code=400, detail="El correo ya está en la lista.")
        entry = models.AllowedEmail(email=normalized_email, note=note, added_by=admin_id)
        db.add(entry)
        db.commit()
        return {"email": entry.email, "note": entry.note}

    def remove_allowed_email(self, db: Session, email: str) -> dict:
        entry = db.query(models.AllowedEmail).filter(models.AllowedEmail.email == email).first()
        if not entry:
            raise HTTPException(status_code=404, detail="Correo no encontrado en la lista.")
        db.delete(entry)
        db.commit()
        return {"detail": "Correo eliminado correctamente."}

    def get_api_stats(self, db: Session, gemini_model: str) -> dict:
        total_users = db.query(models.DBUser).count()
        total_attempts = db.query(models.Attempt).count()
        total_with_ai = db.query(models.Attempt).filter(models.Attempt.ai_feedback != None).count()
        today_start = datetime.datetime.now(datetime.timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        calls_today = db.query(models.Attempt).filter(models.Attempt.created_at >= today_start).count()
        return {
            "total_users": total_users,
            "total_compile_calls": total_attempts,
            "total_assistant_calls": total_with_ai,
            "calls_today": calls_today,
            "model": gemini_model,
            "estimated_tokens": total_with_ai * 800,
        }

    def get_audit_logs(self, db: Session) -> list:
        recent_attempts = (
            db.query(models.Attempt)
            .order_by(models.Attempt.created_at.desc())
            .limit(50)
            .all()
        )
        recent_logins = (
            db.query(models.DBUser)
            .filter(models.DBUser.last_login != None)
            .order_by(models.DBUser.last_login.desc())
            .limit(20)
            .all()
        )

        logs = []
        for a in recent_attempts:
            log_type = "ai" if a.ai_feedback else "compile"
            lab_name = a.laboratory.title if a.laboratory else "Sala de Práctica Libre"
            logs.append({
                "id": str(a.id),
                "type": log_type,
                "action": f"{'Consulta IA' if a.ai_feedback else 'Compilación'} en: {lab_name}",
                "user": a.student.name if a.student else "Anónimo",
                "timestamp": a.created_at.isoformat() if a.created_at else None,
            })
        for u in recent_logins:
            logs.append({
                "id": f"login-{u.id}",
                "type": "auth",
                "action": f"Inicio de sesión: {u.email}",
                "user": u.name,
                "timestamp": u.last_login.isoformat() if u.last_login else None,
            })

        logs.sort(key=lambda x: x["timestamp"] or "", reverse=True)
        return logs[:50]

    def get_settings(self, db: Session, default_model: str) -> dict:
        from core.dependencies import get_setting
        return {
            "gemini_key": get_setting(db, "GEMINI_API_KEY"),
            "openai_key": get_setting(db, "OPENAI_API_KEY"),
            "active_model": get_setting(db, "ACTIVE_MODEL", default_model)
        }

    def update_settings(self, db: Session, gemini_key, openai_key, active_model) -> dict:
        def upsert(k, v):
            if v is not None:
                setting = db.query(models.SystemSetting).filter_by(key=k).first()
                if setting:
                    setting.value = v
                else:
                    db.add(models.SystemSetting(key=k, value=v))

        upsert("GEMINI_API_KEY", gemini_key)
        upsert("OPENAI_API_KEY", openai_key)
        upsert("ACTIVE_MODEL", active_model)
        db.commit()
        return {"message": "Configuración actualizada"}
