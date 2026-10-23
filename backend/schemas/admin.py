"""
Schemas de Administración — DTOs para gestión de usuarios, whitelist y configuración.
"""
from pydantic import BaseModel
from typing import Optional


class UserUpdateRoleRequest(BaseModel):
    """DTO para actualizar el rol de un usuario."""
    role: str


class UserUpdateStatusRequest(BaseModel):
    """DTO para activar/desactivar un usuario."""
    is_active: bool


class AllowedEmailRequest(BaseModel):
    """DTO para agregar un correo a la lista blanca."""
    email: str
    note: Optional[str] = None


class SystemSettingsUpdate(BaseModel):
    """DTO para actualizar las configuraciones del sistema (API Keys, modelo activo)."""
    gemini_key: Optional[str] = None
    openai_key: Optional[str] = None
    active_model: Optional[str] = None
