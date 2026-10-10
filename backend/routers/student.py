from fastapi import APIRouter, Depends, Header, WebSocket, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import time
import math

from core.dependencies import get_db
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
def get_student_dashboard(email: str, db: Session = Depends(get_db)):
    return _student_service.get_dashboard(db, email)


@router.get("/labs")
def get_all_labs_for_student(db: Session = Depends(get_db)):
    return _student_service.get_all_labs(db)


@router.get("/progress/{email}")
def get_student_progress(email: str, db: Session = Depends(get_db)):
    return _student_service.get_progress(db, email)


@router.put("/attempts/{attempt_id}/rate")
def rate_attempt(
    attempt_id: str,
    req: AttemptRatingRequest,
    x_user_id: str = Header(None),
    db: Session = Depends(get_db)
):
    return _student_service.rate_attempt(db, x_user_id, attempt_id, req.rating, req.comment)


@router.get("/announcements")
def get_student_announcements(x_user_id: str = Header(None), db: Session = Depends(get_db)):
    return _student_service.get_announcements(db)


@router.websocket("/ws/compile")
async def ws_compile_code(websocket: WebSocket, db: Session = Depends(get_db)):
    await _compiler_service.compile_interactive_ws(websocket, db)


@router.post("/run-tests")
async def run_tests(req: RunTestsRequest, x_user_id: str = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Header X-User-ID faltante")
    now = time.monotonic()
    last = _eval_last_call.get(x_user_id, 0)
    if now - last < _EVAL_COOLDOWN_SEC:
        raise HTTPException(status_code=429, detail=f"Espera {math.ceil(_EVAL_COOLDOWN_SEC - (now - last))}s antes de evaluar de nuevo.")
    _eval_last_call[x_user_id] = now
    return await _compiler_service.run_test_cases(db, x_user_id, req.code, req.language, req.laboratory_id)


@router.post("/assistant")
def ask_assistant(req: AssistantRequest, x_user_id: str = Header(None), db: Session = Depends(get_db)):
    return _assistant_service.ask(db, x_user_id, req)


@router.post("/assistant/stream")
def ask_assistant_stream(req: AssistantRequest, x_user_id: str = Header(None), db: Session = Depends(get_db)):
    generator = _assistant_service.ask_stream(db, x_user_id, req)
    return StreamingResponse(generator, media_type="text/plain; charset=utf-8")
