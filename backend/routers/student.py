from fastapi import APIRouter, Depends, WebSocket, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import time
import math
from uuid import UUID

import models
from core.dependencies import get_current_user, get_db
from core.security import COOKIE_NAME, verify_session_token
from schemas.student import RunTestsRequest, AttemptRatingRequest, AssistantRequest
from services.student_service import StudentService
from services.compiler.compiler_service import CompilerService
from services.assistant_service import AssistantService

router = APIRouter(prefix="/api/student", tags=["Estudiante"])

_student_service = StudentService()
_compiler_service = CompilerService()
_assistant_service = AssistantService()

_eval_last_call: dict[str, float] = {}
_EVAL_COOLDOWN_SEC = 8


@router.get("/dashboard/{email}")
def get_student_dashboard(email: str, user: models.DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return _student_service.get_dashboard(db, user.email)


@router.get("/labs")
def get_all_labs_for_student(user: models.DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return _student_service.get_all_labs(db)


@router.get("/progress/{email}")
def get_student_progress(email: str, user: models.DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return _student_service.get_progress(db, user.email)


@router.put("/attempts/{attempt_id}/rate")
def rate_attempt(
    attempt_id: str,
    req: AttemptRatingRequest,
    user: models.DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _student_service.rate_attempt(db, str(user.id), attempt_id, req.rating, req.comment)


@router.get("/announcements")
def get_student_announcements(user: models.DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return _student_service.get_announcements(db)


@router.websocket("/ws/compile")
async def ws_compile_code(websocket: WebSocket, db: Session = Depends(get_db)):
    token = websocket.cookies.get(COOKIE_NAME)
    if not token:
        await websocket.close(code=4401)
        return
    try:
        user_id = verify_session_token(token)
        user = db.query(models.DBUser).filter(models.DBUser.id == UUID(user_id), models.DBUser.is_active.is_(True)).first()
        if not user:
            raise HTTPException(status_code=401)
    except Exception:
        await websocket.close(code=4401)
        return
    await _compiler_service.compile_interactive_ws(websocket, db, str(user.id))


@router.post("/run-tests")
async def run_tests(req: RunTestsRequest, user: models.DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = str(user.id)
    now = time.monotonic()
    last = _eval_last_call.get(user_id, 0)
    if now - last < _EVAL_COOLDOWN_SEC:
        raise HTTPException(status_code=429, detail=f"Espera {math.ceil(_EVAL_COOLDOWN_SEC - (now - last))}s antes de evaluar de nuevo.")
    _eval_last_call[user_id] = now
    return await _compiler_service.run_test_cases(db, user_id, req.code, req.language, req.laboratory_id)


@router.post("/assistant")
def ask_assistant(req: AssistantRequest, user: models.DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return _assistant_service.ask(db, str(user.id), req)


@router.post("/assistant/stream")
def ask_assistant_stream(req: AssistantRequest, user: models.DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    generator = _assistant_service.ask_stream(db, str(user.id), req)
    return StreamingResponse(generator, media_type="text/plain; charset=utf-8")
