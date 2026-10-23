import os

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

import models
from core.dependencies import get_current_user, get_db
from core.security import COOKIE_NAME, create_session_token, verify_google_access_token
from schemas.auth import GoogleIdentity, SessionResponse, UserLoginRequest, UserResponse
from services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

_auth_service = AuthService()


@router.post("/login", response_model=SessionResponse)
def login_or_register_user(auth_data: UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    identity = GoogleIdentity(**verify_google_access_token(auth_data.google_access_token))
    _auth_service.validate_email_eligibility(db, identity)
    user = _auth_service.get_user_by_email(db, identity.email)
    _auth_service.check_user_active(user)

    if user:
        user = _auth_service.login_user(db, user, identity)
    else:
        user = _auth_service.register_user(db, identity)

    token = create_session_token(str(user.id))
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=int(os.getenv("SESSION_TTL_HOURS", "8")) * 3600,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "true").lower() == "true",
        samesite="lax",
        path="/",
    )
    return {"user": _auth_service.serialize_user(user)}


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(
        COOKIE_NAME,
        path="/",
        secure=os.getenv("COOKIE_SECURE", "true").lower() == "true",
        httponly=True,
        samesite="lax",
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: models.DBUser = Depends(get_current_user)):
    return _auth_service.serialize_user(user)
