import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

import models
from schemas.auth import UserLoginRequest


class AuthService:

    def validate_email_eligibility(self, db: Session, auth_data: UserLoginRequest) -> bool:
        email_lower = auth_data.email.lower()
        is_institutional = email_lower.endswith('@virtual.upt.pe')
        is_whitelisted = db.query(models.AllowedEmail).filter(
            models.AllowedEmail.email == email_lower
        ).first() is not None

        # Si está en la lista blanca, pasa directo sin importar la carrera
        if is_whitelisted:
            return True

        # Si no está en la lista, TIENE que ser institucional
        if not is_institutional:
            raise HTTPException(status_code=403, detail="Solo correos institucionales o autorizados están permitidos.")

        # Y además TIENE que pertenecer a la carrera de Ingeniería de Sistemas
        import json
        import urllib.request
        from urllib.error import URLError, HTTPError
        
        url = "https://api-upt.onrender.com/movilesii/api/v1/verify-student"
        payload = {
            "full_name": auth_data.name,
            "career": "Ingeniería de Sistemas"
        }
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status != 200:
                    raise HTTPException(status_code=403, detail="No se pudo verificar tu carrera.")
                # Si asume 200 OK significa que existe, dejamos pasar
        except HTTPError as e:
            if e.code == 404:
                raise HTTPException(status_code=403, detail="No tienes acceso: No figuras como estudiante de Ingeniería de Sistemas.")
            else:
                raise HTTPException(status_code=403, detail="No se pudo validar tu estado universitario.")
        except URLError:
            raise HTTPException(status_code=503, detail="El servicio de verificación de la universidad está temporalmente inactivo.")

        return True

    def get_user_by_email(self, db: Session, email: str):
        return db.query(models.DBUser).filter(models.DBUser.email == email).first()

    def check_user_active(self, user: models.DBUser):
        if user and not user.is_active:
            raise HTTPException(status_code=403, detail="BANNED_USER")

    def login_user(self, db: Session, user: models.DBUser, auth_data: UserLoginRequest) -> models.DBUser:
        user.last_login = datetime.datetime.now(datetime.timezone.utc)
        user.name = auth_data.name
        if auth_data.avatar_url:
            user.avatar_url = auth_data.avatar_url
        db.commit()
        db.refresh(user)
        return user

    def register_user(self, db: Session, auth_data: UserLoginRequest) -> models.DBUser:
        user = models.DBUser(
            email=auth_data.email,
            name=auth_data.name,
            avatar_url=auth_data.avatar_url,
            last_login=datetime.datetime.now(datetime.timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def get_user_by_id(self, db: Session, user_id: str) -> models.DBUser:
        try:
            user_uuid = UUID(user_id)
            user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            return user
        except ValueError:
            raise HTTPException(status_code=401, detail="UUID Invalido")

    def serialize_user(self, user: models.DBUser) -> dict:
        return {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "role": user.role.value,
            "is_active": user.is_active,
            "last_login": user.last_login,
        }
