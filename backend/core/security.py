import base64
import hashlib
import hmac
import json
import os
import time
import urllib.parse
import urllib.request
from urllib.error import HTTPError, URLError

from fastapi import HTTPException


COOKIE_NAME = "alda_session"


def _session_secret() -> bytes:
    secret = os.getenv("SESSION_SECRET", "")
    if len(secret) < 32:
        raise RuntimeError("SESSION_SECRET debe tener al menos 32 caracteres")
    return secret.encode("utf-8")


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_session_token(user_id: str) -> str:
    now = int(time.time())
    ttl_hours = int(os.getenv("SESSION_TTL_HOURS", "8"))
    payload = {"sub": user_id, "iat": now, "exp": now + ttl_hours * 3600}
    encoded = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _b64encode(hmac.new(_session_secret(), encoded.encode("ascii"), hashlib.sha256).digest())
    return f"{encoded}.{signature}"


def verify_session_token(token: str) -> str:
    try:
        encoded, supplied_signature = token.split(".", 1)
        expected_signature = _b64encode(
            hmac.new(_session_secret(), encoded.encode("ascii"), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(supplied_signature, expected_signature):
            raise ValueError("Firma inválida")
        payload = json.loads(_b64decode(encoded))
        if int(payload["exp"]) <= int(time.time()):
            raise ValueError("Sesión expirada")
        return str(payload["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")


def verify_google_access_token(access_token: str) -> dict:
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        raise RuntimeError("GOOGLE_CLIENT_ID no está configurado")

    try:
        token_url = "https://oauth2.googleapis.com/tokeninfo?" + urllib.parse.urlencode(
            {"access_token": access_token}
        )
        with urllib.request.urlopen(token_url, timeout=10) as response:
            token_info = json.load(response)

        audience = token_info.get("aud") or token_info.get("audience") or token_info.get("issued_to")
        if audience != client_id:
            raise HTTPException(status_code=401, detail="El token de Google no pertenece a esta aplicación")
        if int(token_info.get("expires_in", "0")) <= 0:
            raise HTTPException(status_code=401, detail="El token de Google expiró")

        request = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            user_info = json.load(response)

        if not user_info.get("email") or not user_info.get("email_verified"):
            raise HTTPException(status_code=401, detail="Google no confirmó el correo electrónico")
        if token_info.get("email") and token_info["email"].lower() != user_info["email"].lower():
            raise HTTPException(status_code=401, detail="La identidad de Google no coincide")

        return {
            "email": user_info["email"].strip().lower(),
            "name": user_info.get("name") or user_info["email"].split("@", 1)[0],
            "avatar_url": user_info.get("picture"),
        }
    except HTTPException:
        raise
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="No se pudo validar la sesión con Google")
