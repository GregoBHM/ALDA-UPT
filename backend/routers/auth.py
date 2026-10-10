from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import List

from core.dependencies import get_db
from schemas.auth import UserLoginRequest, UserResponse
from services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

_auth_service = AuthService()


@router.post("/login", response_model=UserResponse)
def login_or_register_user(auth_data: UserLoginRequest, db: Session = Depends(get_db)):
    _auth_service.validate_email_eligibility(db, auth_data)
    user = _auth_service.get_user_by_email(db, auth_data.email)
    _auth_service.check_user_active(user)

    if user:
        user = _auth_service.login_user(db, user, auth_data)
    else:
        user = _auth_service.register_user(db, auth_data)

    return _auth_service.serialize_user(user)


@router.get("/me", response_model=UserResponse)
def get_current_user(x_user_id: str = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="X-User-ID faltante")
    user = _auth_service.get_user_by_id(db, x_user_id)
    return _auth_service.serialize_user(user)
