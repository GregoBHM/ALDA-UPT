from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

import models
from core.dependencies import get_db, verify_admin_role
from schemas.auth import UserResponse
from schemas.admin import UserUpdateRoleRequest, UserUpdateStatusRequest, AllowedEmailRequest, SystemSettingsUpdate
from services.admin_service import AdminService

router = APIRouter(prefix="/api/admin", tags=["Administración"])

_admin_service = AdminService()
_GEMINI_MODEL = "gemini-2.5-flash"


@router.get("/users", response_model=List[UserResponse])
def get_all_users(admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(get_db)):
    return _admin_service.get_all_users(db)


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: str, request: UserUpdateRoleRequest,
                     admin: models.DBUser = Depends(verify_admin_role),
                     db: Session = Depends(get_db)):
    return _admin_service.update_user_role(db, user_id, request.role)


@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(user_id: str, request: UserUpdateStatusRequest,
                       admin: models.DBUser = Depends(verify_admin_role),
                       db: Session = Depends(get_db)):
    return _admin_service.update_user_status(db, user_id, request.is_active, admin.id)


@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(get_db)):
    return _admin_service.delete_user(db, user_id, admin.id)


@router.get("/allowed-emails")
def get_allowed_emails(admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(get_db)):
    return _admin_service.get_allowed_emails(db)


@router.post("/allowed-emails")
def add_allowed_email(req: AllowedEmailRequest, admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(get_db)):
    return _admin_service.add_allowed_email(db, req.email, req.note, admin.id)


@router.delete("/allowed-emails/{email}")
def remove_allowed_email(email: str, admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(get_db)):
    return _admin_service.remove_allowed_email(db, email)


@router.get("/api-stats")
def get_api_stats(admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(get_db)):
    return _admin_service.get_api_stats(db, _GEMINI_MODEL)


@router.get("/audit-logs")
def get_audit_logs(admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(get_db)):
    return _admin_service.get_audit_logs(db)


@router.get("/settings")
def get_system_settings(admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(get_db)):
    return _admin_service.get_settings(db, _GEMINI_MODEL)


@router.post("/settings")
def update_system_settings(req: SystemSettingsUpdate,
                           admin: models.DBUser = Depends(verify_admin_role),
                           db: Session = Depends(get_db)):
    return _admin_service.update_settings(db, req.gemini_key, req.openai_key, req.active_model)
