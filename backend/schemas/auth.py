"""
Schemas de Autenticación — DTOs para login, registro y perfil de usuario.
"""
from pydantic import BaseModel
from typing import Optional
import datetime


class UserLoginRequest(BaseModel):
    """DTO de entrada para el endpoint de login/registro."""
    email: str
    name: str
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    """DTO de salida estándar para representar un usuario."""
    id: str
    email: str
    name: str
    avatar_url: Optional[str]
    role: str
    is_active: bool
    last_login: Optional[datetime.datetime]

    class Config:
        from_attributes = True
