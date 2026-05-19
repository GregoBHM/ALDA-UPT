from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import datetime
import uuid
from uuid import UUID
import re
import os
import asyncio
import json
import time
import subprocess
from dotenv import load_dotenv

load_dotenv()

from google import genai as _genai
from google.genai import types as _gtypes

_GEMINI_KEY = os.getenv("GOOGLE_AI_API_KEY", "")
def get_system_prompt():
    prompt_path = os.path.join(os.path.dirname(__file__), "system_prompt.txt")
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    return "Eres un tutor socrático de programación."
def get_setting(db, key_name: str, default_val: str = "") -> str:
    setting = db.query(models.SystemSetting).filter_by(key=key_name).first()
    return setting.value if setting and setting.value else default_val

# Remove global static client initialization
_GEMINI_MODEL = "gemini-2.5-flash"

import models, database

app = FastAPI(title="ALDA Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserLoginRequest(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None


class UserUpdateRoleRequest(BaseModel):
    role: str


class UserUpdateStatusRequest(BaseModel):
    is_active: bool


class CompileRequest(BaseModel):
    code: str
    language: str = "cpp"
    laboratory_id: Optional[str] = None


class ChatMessage(BaseModel):
    role: str   # 'user' | 'model'
    text: str


class AssistantRequest(BaseModel):
    messages: List[ChatMessage]   # historial completo
    code: Optional[str] = None    # código actual del editor
    language: Optional[str] = None
    laboratory_id: Optional[str] = None
    terminal_output: Optional[str] = None # Para enviar errores de consola



class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: Optional[str]
    role: str
    is_active: bool
    last_login: Optional[datetime.datetime]

    class Config:
        from_attributes = True


def verify_admin_role(x_user_id: str = Header(None), db: Session = Depends(database.get_db)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Header X-User-ID faltante")
    try:
        user_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de UUID inválido")
    user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol admin")
    return user


@app.post("/api/auth/login", response_model=UserResponse)
def login_or_register_user(auth_data: UserLoginRequest, db: Session = Depends(database.get_db)):
    is_institutional = auth_data.email.endswith('@virtual.upt.pe')
    is_whitelisted = db.query(models.AllowedEmail).filter(
        models.AllowedEmail.email == auth_data.email
    ).first() is not None

    if not is_institutional and not is_whitelisted:
        raise HTTPException(status_code=403, detail="Solo correos institucionales o autorizados están permitidos.")

    user = db.query(models.DBUser).filter(models.DBUser.email == auth_data.email).first()

    if user and not user.is_active:
        raise HTTPException(status_code=403, detail="BANNED_USER")

    if user:
        user.last_login = datetime.datetime.now(datetime.timezone.utc)
        user.name = auth_data.name
        if auth_data.avatar_url:
            user.avatar_url = auth_data.avatar_url
        db.commit()
        db.refresh(user)
    else:
        user = models.DBUser(
            email=auth_data.email,
            name=auth_data.name,
            avatar_url=auth_data.avatar_url,
            last_login=datetime.datetime.now(datetime.timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "role": user.role.value,
        "is_active": user.is_active,
        "last_login": user.last_login,
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user(x_user_id: str = Header(None), db: Session = Depends(database.get_db)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID faltante")
    try:
        user_uuid = UUID(x_user_id)
        user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "role": user.role.value,
            "is_active": user.is_active,
            "last_login": user.last_login,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="UUID Invalido")


# ── ADMIN ────────────────────────────────────────────────────────────────────

@app.get("/api/admin/users", response_model=List[UserResponse])
def get_all_users(admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(database.get_db)):
    return [{"id": str(u.id), "email": u.email, "name": u.name, "avatar_url": u.avatar_url,
             "role": u.role.value, "is_active": u.is_active, "last_login": u.last_login}
            for u in db.query(models.DBUser).all()]


@app.put("/api/admin/users/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: str, request: UserUpdateRoleRequest,
                     admin: models.DBUser = Depends(verify_admin_role),
                     db: Session = Depends(database.get_db)):
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="UUID inválido")
    if request.role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Rol inválido")
    user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.role = request.role
    db.commit()
    db.refresh(user)
    return {"id": str(user.id), "email": user.email, "name": user.name, "avatar_url": user.avatar_url,
            "role": user.role.value, "is_active": user.is_active, "last_login": user.last_login}


@app.put("/api/admin/users/{user_id}/status", response_model=UserResponse)
def update_user_status(user_id: str, request: UserUpdateStatusRequest,
                       admin: models.DBUser = Depends(verify_admin_role),
                       db: Session = Depends(database.get_db)):
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="UUID inválido")
    user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="No puedes cambiar tu propio estado")
    user.is_active = request.is_active
    db.commit()
    db.refresh(user)
    return {"id": str(user.id), "email": user.email, "name": user.name, "avatar_url": user.avatar_url,
            "role": user.role.value, "is_active": user.is_active, "last_login": user.last_login}


@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: str, admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(database.get_db)):
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="UUID inválido")
    
    if str(user_uuid) == str(admin.id):
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo.")
        
    user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    db.delete(user)
    db.commit()
    return {"detail": "Usuario eliminado correctamente"}


class AllowedEmailRequest(BaseModel):
    email: str
    note: Optional[str] = None


@app.get("/api/admin/allowed-emails")
def get_allowed_emails(admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(database.get_db)):
    entries = db.query(models.AllowedEmail).order_by(models.AllowedEmail.created_at.desc()).all()
    return [{"email": e.email, "note": e.note, "created_at": e.created_at} for e in entries]


@app.post("/api/admin/allowed-emails")
def add_allowed_email(req: AllowedEmailRequest, admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(database.get_db)):
    normalized_email = req.email.lower()
    existing = db.query(models.AllowedEmail).filter(models.AllowedEmail.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está en la lista.")
    entry = models.AllowedEmail(email=normalized_email, note=req.note, added_by=admin.id)
    db.add(entry)
    db.commit()
    return {"email": entry.email, "note": entry.note}


@app.delete("/api/admin/allowed-emails/{email}")
def remove_allowed_email(email: str, admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(database.get_db)):
    entry = db.query(models.AllowedEmail).filter(models.AllowedEmail.email == email).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Correo no encontrado en la lista.")
    db.delete(entry)
    db.commit()
    return {"detail": "Correo eliminado correctamente."}


@app.get("/api/admin/api-stats")
def get_api_stats(admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(database.get_db)):
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
        "model": _GEMINI_MODEL,
        "estimated_tokens": total_with_ai * 800,
    }


@app.get("/api/admin/audit-logs")
def get_audit_logs(admin: models.DBUser = Depends(verify_admin_role), db: Session = Depends(database.get_db)):
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


def verify_teacher_role(x_user_id: str = Header(None), db: Session = Depends(database.get_db)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Header X-User-ID faltante")
    try:
        user_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de UUID inválido")
    user = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.role.value not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol teacher o admin")
    return user

class AnnouncementRequest(BaseModel):
    title: str
    content: str


@app.get("/api/teacher/announcements")
def get_teacher_announcements(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    if teacher.role.value == "admin":
        items = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()
    else:
        items = db.query(models.Announcement).filter(
            models.Announcement.teacher_id == teacher.id
        ).order_by(models.Announcement.created_at.desc()).all()
    return [{"id": str(a.id), "title": a.title, "content": a.content, "created_at": a.created_at} for a in items]


@app.post("/api/teacher/announcements")
def create_announcement(req: AnnouncementRequest, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    ann = models.Announcement(teacher_id=teacher.id, title=req.title, content=req.content)
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return {"id": str(ann.id), "title": ann.title, "content": ann.content, "created_at": ann.created_at}


@app.delete("/api/teacher/announcements/{announcement_id}")
def delete_announcement(announcement_id: str, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    try:
        ann_uuid = UUID(announcement_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido.")
    if teacher.role.value == "admin":
        ann = db.query(models.Announcement).filter(models.Announcement.id == ann_uuid).first()
    else:
        ann = db.query(models.Announcement).filter(
            models.Announcement.id == ann_uuid,
            models.Announcement.teacher_id == teacher.id
        ).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Anuncio no encontrado.")
    db.delete(ann)
    db.commit()
    return {"detail": "Anuncio eliminado."}


@app.get("/api/student/announcements")
def get_student_announcements(x_user_id: str = Header(None), db: Session = Depends(database.get_db)):
    items = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).limit(5).all()
    return [{"id": str(a.id), "title": a.title, "content": a.content, "created_at": a.created_at} for a in items]


@app.get("/api/teacher/stats")
def get_teacher_stats(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    total_students = db.query(models.DBUser).filter(models.DBUser.role == "student").count()
    total_labs = db.query(models.Laboratory).count()
    total_attempts = db.query(models.Attempt).count()
    total_with_ai = db.query(models.Attempt).filter(models.Attempt.ai_feedback != None).count()

    recent_students = (
        db.query(models.DBUser)
        .filter(models.DBUser.role == "student", models.DBUser.last_login != None)
        .order_by(models.DBUser.last_login.desc())
        .limit(5)
        .all()
    )

    return {
        "total_students": total_students,
        "total_labs": total_labs,
        "total_attempts": total_attempts,
        "total_with_ai": total_with_ai,
        "independence_rate": round((1 - total_with_ai / max(total_attempts, 1)) * 100, 1),
        "recent_students": [
            {"name": s.name, "email": s.email, "last_login": s.last_login.isoformat() if s.last_login else None}
            for s in recent_students
        ],
    }


@app.get("/api/teacher/error-analytics")
def get_error_analytics(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    all_attempts = (
        db.query(models.Attempt)
        .order_by(models.Attempt.created_at.desc())
        .limit(200)
        .all()
    )

    per_lab = {}
    error_patterns = {}
    students_struggling = {}

    for a in all_attempts:
        lab_title = a.laboratory.title if a.laboratory else "Sin lab"
        if lab_title not in per_lab:
            per_lab[lab_title] = {"total": 0, "with_errors": 0, "with_ai": 0}
        per_lab[lab_title]["total"] += 1
        if a.ai_feedback:
            per_lab[lab_title]["with_ai"] += 1
            per_lab[lab_title]["with_errors"] += 1

        student_name = a.student.name if a.student else "Anónimo"
        if student_name not in students_struggling:
            students_struggling[student_name] = 0
        if a.ai_feedback:
            students_struggling[student_name] += 1

        if a.ai_feedback:
            feedback = a.ai_feedback.lower()
            if "segmentation" in feedback or "puntero" in feedback or "null" in feedback:
                error_patterns["Errores de punteros/memoria"] = error_patterns.get("Errores de punteros/memoria", 0) + 1
            elif "index" in feedback or "rango" in feedback or "bounds" in feedback:
                error_patterns["Desbordamiento de arreglo"] = error_patterns.get("Desbordamiento de arreglo", 0) + 1
            elif "syntax" in feedback or "sintaxis" in feedback or "semicolon" in feedback:
                error_patterns["Errores de sintaxis"] = error_patterns.get("Errores de sintaxis", 0) + 1
            elif "loop" in feedback or "bucle" in feedback or "infinit" in feedback:
                error_patterns["Bucles infinitos/lógica"] = error_patterns.get("Bucles infinitos/lógica", 0) + 1
            elif "type" in feedback or "tipo" in feedback or "cast" in feedback:
                error_patterns["Errores de tipo"] = error_patterns.get("Errores de tipo", 0) + 1
            else:
                error_patterns["Otros errores"] = error_patterns.get("Otros errores", 0) + 1

    top_struggling = sorted(students_struggling.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "per_lab": [{"lab": k, **v} for k, v in per_lab.items()],
        "error_patterns": [{"pattern": k, "count": v} for k, v in sorted(error_patterns.items(), key=lambda x: x[1], reverse=True)],
        "top_struggling": [{"student": s[0], "ai_requests": s[1]} for s in top_struggling],
        "total_analyzed": len(all_attempts),
    }


@app.get("/api/teacher/reports/export-excel")
def export_excel_report(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    try:
        import pandas as pd
        from fastapi.responses import StreamingResponse
        import io

        all_attempts = (
            db.query(models.Attempt)
            .order_by(models.Attempt.created_at.desc())
            .limit(500)
            .all()
        )

        rows = []
        for a in all_attempts:
            rows.append({
                "Estudiante": a.student.name if a.student else "Anónimo",
                "Correo": a.student.email if a.student else "—",
                "Laboratorio": a.laboratory.title if a.laboratory else "—",
                "N° Intento": a.attempt_number,
                "Usó Asistente IA": "Sí" if a.ai_feedback else "No",
                "Aprobado": "Sí" if a.ai_feedback and "✅ APROBADO" in a.ai_feedback else "No",
                "Calificación IA": "Útil" if a.ai_rating == 1 else ("No útil" if a.ai_rating == -1 else "Sin calificar"),
                "Fecha": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "—",
            })

        df_attempts = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["Estudiante","Correo","Laboratorio","N° Intento","Usó Asistente IA","Aprobado","Calificación IA","Fecha"])

        per_lab_rows = []
        per_lab_grouped = {}
        for a in all_attempts:
            lab = a.laboratory.title if a.laboratory else "Sin lab"
            if lab not in per_lab_grouped:
                per_lab_grouped[lab] = {"total": 0, "con_ia": 0, "aprobados": 0}
            per_lab_grouped[lab]["total"] += 1
            if a.ai_feedback:
                per_lab_grouped[lab]["con_ia"] += 1
            if a.ai_feedback and "✅ APROBADO" in a.ai_feedback:
                per_lab_grouped[lab]["aprobados"] += 1

        for lab, stats in per_lab_grouped.items():
            tasa = round((stats["aprobados"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
            per_lab_rows.append({
                "Laboratorio": lab,
                "Total Intentos": stats["total"],
                "Con Asistente IA": stats["con_ia"],
                "Aprobados": stats["aprobados"],
                "Tasa de Éxito (%)": tasa,
            })

        df_labs = pd.DataFrame(per_lab_rows) if per_lab_rows else pd.DataFrame()

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df_attempts.to_excel(writer, index=False, sheet_name="Intentos Detallados")
            df_labs.to_excel(writer, index=False, sheet_name="Por Laboratorio")

            for sheet_name in writer.sheets:
                ws = writer.sheets[sheet_name]
                for col in ws.columns:
                    max_len = max((len(str(cell.value or "")) for cell in col), default=10)
                    ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 40)

        output.seek(0)
        filename = f"ALDA_Reporte_{__import__('datetime').date.today().isoformat()}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ImportError:
        raise HTTPException(status_code=500, detail="Se requiere instalar: pip install pandas openpyxl")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class KnowledgeItemRequest(BaseModel):
    title: str
    content: str


@app.get("/api/teacher/knowledge")
def get_knowledge_items(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    import json as _json
    items = db.query(models.SystemConfig).filter(models.SystemConfig.key.like("knowledge_%")).all()
    result = []
    for item in items:
        val = item.value if isinstance(item.value, dict) else _json.loads(item.value)
        result.append({
            "key": item.key,
            "title": val.get("title", "Sin título"),
            "content": val.get("content", ""),
            "source": val.get("source", "text"),
            "chunks": val.get("chunks", 0),
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        })
    return result


@app.post("/api/teacher/knowledge")
def add_knowledge_item(req: KnowledgeItemRequest, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    import json as _json
    import chroma_service

    key = f"knowledge_{uuid.uuid4().hex[:8]}"

    try:
        num_chunks = chroma_service.add_document(key, req.title, req.content)
    except Exception as e:
        num_chunks = 0

    item = models.SystemConfig(
        key=key,
        value={"title": req.title, "content": req.content, "source": "text", "chunks": num_chunks},
        description=f"Conocimiento RAG: {req.title}",
        updated_by=teacher.id,
        updated_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(item)
    db.commit()
    return {"message": "Conocimiento guardado exitosamente", "key": key, "chunks_created": num_chunks}


@app.post("/api/teacher/knowledge/upload-pdf")
async def upload_pdf_knowledge(
    file: UploadFile = File(...),
    title: str = Form(...),
    x_user_id: str = Header(None),
    db: Session = Depends(database.get_db)
):
    teacher = verify_teacher_role.__wrapped__(x_user_id, db) if hasattr(verify_teacher_role, '__wrapped__') else None
    if not teacher:
        if not x_user_id:
            raise HTTPException(status_code=401, detail="Header X-User-ID faltante")
        try:
            user_uuid = UUID(x_user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de UUID inválido")
        teacher = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if teacher.role.value not in ("teacher", "admin"):
            raise HTTPException(status_code=403, detail="Acceso denegado")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    MAX_PDF_SIZE_MB = 100
    MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024

    import json as _json

    content_bytes = await file.read()

    if len(content_bytes) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"El archivo pesa {len(content_bytes) / 1024 / 1024:.1f} MB. El límite máximo es {MAX_PDF_SIZE_MB} MB."
        )

    try:
        import pdfplumber
        import io
        with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error leyendo el PDF con pdfplumber: {str(e)}")

    if not full_text.strip():
        raise HTTPException(status_code=422, detail="El PDF no contiene texto extraíble (podría ser una imagen escaneada)")

    key = f"knowledge_{uuid.uuid4().hex[:8]}"

    try:
        import chroma_service
        num_chunks = chroma_service.add_document(key, title, full_text)
    except Exception as e:
        num_chunks = 0

    preview = full_text[:500] + ("..." if len(full_text) > 500 else "")
    item = models.SystemConfig(
        key=key,
        value={
            "title": title,
            "content": preview,
            "source": "pdf",
            "filename": file.filename,
            "chunks": num_chunks,
            "total_chars": len(full_text),
        },
        description=f"PDF RAG: {title} ({file.filename})",
        updated_by=teacher.id,
        updated_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(item)
    db.commit()

    return {
        "message": "PDF procesado y vectorizado exitosamente",
        "key": key,
        "filename": file.filename,
        "chunks_created": num_chunks,
        "total_chars": len(full_text),
    }


@app.delete("/api/teacher/knowledge/{key}")
def delete_knowledge_item(key: str, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    try:
        import chroma_service
        chroma_service.delete_document(key)
    except Exception:
        pass

    item = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    db.delete(item)
    db.commit()
    return {"message": "Conocimiento eliminado de la BD y del vector store"}


class TestCaseCreateRequest(BaseModel):
    input_data: str
    expected_output: str
    is_hidden: bool = False

class LabCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: str = "medium"
    is_exam: bool = False
    test_cases: List[TestCaseCreateRequest] = []


@app.get("/api/teacher/labs")
def get_teacher_labs(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    if teacher.role.value == "admin":
        labs = db.query(models.Laboratory).all()
    else:
        labs = db.query(models.Laboratory).filter(models.Laboratory.teacher_id == teacher.id).all()
    result = []
    for lab in labs:
        tcs = db.query(models.TestCase).filter(models.TestCase.laboratory_id == lab.id).all()
        result.append({
            "id": str(lab.id),
            "teacher_name": lab.teacher.name if lab.teacher else "Sistema",
            "title": lab.title,
            "description": lab.description,
            "difficulty": lab.difficulty or "medium",
            "is_exam": lab.is_exam,
            "test_cases": [{"input_data": tc.input_data, "expected_output": tc.expected_output, "is_hidden": tc.is_hidden} for tc in tcs]
        })
    return result

@app.post("/api/teacher/labs")
def create_teacher_lab(req: LabCreateRequest, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    lab = models.Laboratory(
        teacher_id=teacher.id,
        title=req.title,
        description=req.description,
        difficulty=req.difficulty,
        is_exam=req.is_exam
    )
    db.add(lab)
    db.flush()

    for tc in req.test_cases:
        test_case = models.TestCase(laboratory_id=lab.id, input_data=tc.input_data, expected_output=tc.expected_output, is_hidden=tc.is_hidden)
        db.add(test_case)

    db.commit()
    return {"message": "Reto y casos de prueba creados", "id": str(lab.id)}

@app.delete("/api/teacher/labs/{lab_id}")
def delete_teacher_lab(lab_id: str, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(database.get_db)):
    try:
        lab_uuid = UUID(lab_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    lab = db.query(models.Laboratory).filter(models.Laboratory.id == lab_uuid).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratorio no encontrado")
        
    if teacher.role.value != "admin" and str(lab.teacher_id) != str(teacher.id):
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este laboratorio")
        
    db.delete(lab)
    db.commit()
    return {"message": "Laboratorio eliminado"}


# ── STUDENT ───────────────────────────────────────────────────────────────────

@app.get("/api/student/dashboard/{email}")
def get_student_dashboard(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.DBUser).filter(models.DBUser.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    total_labs = db.query(models.Laboratory).count()

    attempts_count = db.query(models.Attempt).filter(
        models.Attempt.student_id == user.id
    ).count()

    ai_hints = db.query(models.Attempt).filter(
        models.Attempt.student_id == user.id,
        models.Attempt.ai_feedback != None,
    ).count()

    last_lab = (
        db.query(models.Laboratory)
        .join(models.Attempt)
        .filter(models.Attempt.student_id == user.id)
        .order_by(models.Attempt.created_at.desc())
        .first()
    )

    return {
        "available_labs": total_labs,
        "practice_hours": round(attempts_count * 0.25, 1) if attempts_count > 0 else 0,
        "ai_hints_used": ai_hints,
        "total_attempts": attempts_count,
        "latest_lab": {
            "title": last_lab.title if last_lab else "Sin laboratorio",
            "difficulty": last_lab.difficulty if last_lab else "medium",
        } if last_lab else None,
    }


@app.get("/api/student/labs")
def get_all_labs_for_student(db: Session = Depends(database.get_db)):
    """Retorna todos los retos/laboratorios disponibles para cualquier estudiante."""
    labs = db.query(models.Laboratory).order_by(models.Laboratory.created_at.desc()).all()
    return [
        {
            "id": str(lab.id),
            "title": lab.title,
            "description": lab.description or "Sin descripción.",
            "difficulty": lab.difficulty or "medium",
            "is_exam": lab.is_exam,
            "teacher_name": lab.teacher.name if lab.teacher else "Sistema",
            "created_at": lab.created_at.isoformat() if lab.created_at else None,
            "test_cases": [
                {"input_data": tc.input_data, "expected_output": tc.expected_output}
                for tc in lab.test_cases if not tc.is_hidden
            ],
            "total_test_cases": len(lab.test_cases),
        }
        for lab in labs
    ]

class SystemSettingsUpdate(BaseModel):
    gemini_key: Optional[str] = None
    openai_key: Optional[str] = None
    active_model: Optional[str] = None

@app.get("/api/admin/settings")
def get_system_settings(x_user_id: str = Header(None), db: Session = Depends(database.get_db)):
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    return {
        "gemini_key": get_setting(db, "GEMINI_API_KEY"),
        "openai_key": get_setting(db, "OPENAI_API_KEY"),
        "active_model": get_setting(db, "ACTIVE_MODEL", _GEMINI_MODEL)
    }

@app.post("/api/admin/settings")
def update_system_settings(req: SystemSettingsUpdate, x_user_id: str = Header(None), db: Session = Depends(database.get_db)):
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    def upsert(k, v):
        if v is not None:
            setting = db.query(models.SystemSetting).filter_by(key=k).first()
            if setting:
                setting.value = v
            else:
                db.add(models.SystemSetting(key=k, value=v))

    upsert("GEMINI_API_KEY", req.gemini_key)
    upsert("OPENAI_API_KEY", req.openai_key)
    upsert("ACTIVE_MODEL", req.active_model)
    db.commit()
    return {"message": "Configuración actualizada"}


@app.get("/api/student/progress/{email}")
def get_student_progress(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.DBUser).filter(models.DBUser.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    all_attempts = (
        db.query(models.Attempt)
        .filter(models.Attempt.student_id == user.id)
        .order_by(models.Attempt.created_at.desc())
        .all()
    )

    total = len(all_attempts)
    with_ai = sum(1 for a in all_attempts if a.ai_feedback)
    
    # Determinar qué laboratorios han sido resueltos (al menos un intento aprobado)
    solved_labs_ids = set(
        a.laboratory_id for a in all_attempts 
        if a.ai_feedback and "✅ APROBADO" in a.ai_feedback
    )
    
    total_labs = db.query(models.Laboratory).count()
    solved_count = len(solved_labs_ids)

    recent = [
        {
            "id": str(a.id),
            "lab_title": a.laboratory.title if a.laboratory else "Sala de Práctica Libre",
            "attempt_number": a.attempt_number,
            "had_ai_help": a.ai_feedback is not None and "✅ APROBADO" not in a.ai_feedback and "❌ NO APROBADO" not in a.ai_feedback,
            "is_passed": a.ai_feedback is not None and "✅ APROBADO" in a.ai_feedback,
            "is_failed": a.ai_feedback is not None and "❌ NO APROBADO" in a.ai_feedback,
            "date": a.created_at.isoformat() if a.created_at else None,
        }
        for a in all_attempts[:10]
    ]

    return {
        "total_attempts": total,
        "attempts_with_ai": with_ai,
        "independent_attempts": total - with_ai,
        "solved_count": solved_count,
        "total_labs": total_labs,
        "recent_activity": recent,
    }


class AttemptRatingRequest(BaseModel):
    rating: int
    comment: Optional[str] = None


@app.put("/api/student/attempts/{attempt_id}/rate")
def rate_attempt(
    attempt_id: str,
    req: AttemptRatingRequest,
    x_user_id: str = Header(None),
    db: Session = Depends(database.get_db)
):
    if req.rating not in (1, -1):
        raise HTTPException(status_code=400, detail="El rating debe ser 1 (útil) o -1 (no útil).")
    try:
        attempt_uuid = UUID(attempt_id)
        user_uuid = UUID(x_user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="ID inválido.")
    attempt = db.query(models.Attempt).filter(
        models.Attempt.id == attempt_uuid,
        models.Attempt.student_id == user_uuid
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Intento no encontrado.")
    attempt.ai_rating = req.rating
    attempt.ai_rating_comment = req.comment
    db.commit()
    return {"detail": "Calificación registrada.", "rating": req.rating}


import tempfile
import sys
import shutil

async def _read_stream(stream, websocket: WebSocket, msg_type: str, tmpdir: str = ""):
    while True:
        chunk = await stream.read(1024)
        if not chunk:
            break
        text = chunk.decode('utf-8', errors='replace')
        if tmpdir:
            text = text.replace(tmpdir + os.sep, "").replace(tmpdir + "/", "")
        await websocket.send_text(json.dumps({"type": msg_type, "text": text}))

@app.websocket("/api/student/ws/compile")
async def ws_compile_code(websocket: WebSocket, db: Session = Depends(database.get_db)):
    await websocket.accept()
    tmpdir = tempfile.mkdtemp()
    proc = None
    try:
        # 1. Esperar configuración inicial (código y lenguaje)
        init_data = await websocket.receive_text()
        req = json.loads(init_data)
        code = req.get("code", "")
        lang = req.get("language", "cpp").lower()
        lab_id = req.get("laboratory_id")
        user_id = req.get("user_id") # Opcional por ahora en WS

        # Guardar intento (sincrono por simplicidad, aunque idealmente async)
        try:
            if user_id and lab_id:
                student_uuid = UUID(user_id)
                lab_uuid = UUID(lab_id)
                prev_attempts = db.query(models.Attempt).filter(
                    models.Attempt.student_id == student_uuid,
                    models.Attempt.laboratory_id == lab_uuid
                ).count()
                attempt = models.Attempt(
                    student_id=student_uuid,
                    laboratory_id=lab_uuid,
                    code_snapshot=code,
                    student_intention="Compilación Interactiva (WS)",
                    attempt_number=prev_attempts + 1
                )
                db.add(attempt)
                db.commit()
        except Exception as e:
            print("Error saving WS attempt:", e)

        start = time.time()
        cmd = []

        docker_base = [
            "docker", "run", "--rm", "-i",
            "--network=none", "--pids-limit=50", "--memory=100m", "--cpus=0.5",
            "-v", f"{tmpdir}:/app:ro", "-w", "/app"
        ]

        await websocket.send_text(json.dumps({"type": "system", "text": "⚡ Preparando entorno seguro de ejecución..."}))

        # 2. Configurar el comando según lenguaje
        if lang == "python":
            src = os.path.join(tmpdir, "main.py")
            with open(src, "w", encoding="utf-8") as f:
                f.write(code)
            cmd = docker_base + ["python:3.10-alpine", "python", "-u", "main.py"]
        elif lang == "javascript":
            src = os.path.join(tmpdir, "main.js")
            with open(src, "w", encoding="utf-8") as f:
                f.write(code)
            cmd = docker_base + ["node:18-alpine", "node", "main.js"]
        elif lang == "java":
            import re as _re
            match = _re.search(r'public\s+class\s+(\w+)', code)
            class_name = match.group(1) if match else "Main"
            src = os.path.join(tmpdir, f"{class_name}.java")
            with open(src, "w", encoding="utf-8") as f:
                f.write(code)
            # Cambiamos docker_base para que el volumen sea rw, ya que necesita escribir los .class
            docker_base_rw = [
                "docker", "run", "--rm", "-i",
                "--network=none", "--pids-limit=50", "--memory=100m", "--cpus=0.5",
                "-v", f"{tmpdir}:/app", "-w", "/app"
            ]
            cmd = docker_base_rw + ["eclipse-temurin:17-alpine", "sh", "-c", f"javac {class_name}.java && java {class_name}"]
        elif lang == "cpp":
            src = os.path.join(tmpdir, "main.cpp")
            with open(src, "w", encoding="utf-8") as f:
                f.write(code)
            docker_base_rw = [
                "docker", "run", "--rm", "-i",
                "--network=none", "--pids-limit=50", "--memory=100m", "--cpus=0.5",
                "-v", f"{tmpdir}:/app", "-w", "/app"
            ]
            cmd = docker_base_rw + ["gcc:12", "sh", "-c", "g++ main.cpp -o a.out && ./a.out"]
        elif lang == "bash":
            src = os.path.join(tmpdir, "main.sh")
            with open(src, "w", encoding="utf-8") as f:
                f.write(code)
            cmd = docker_base + ["bash:5-alpine", "bash", "main.sh"]
        else:
            await websocket.send_text(json.dumps({"type": "error", "text": f"Lenguaje no soportado: {lang}"}))
            return

        # 3. Lanzar el proceso de ejecución
        import subprocess
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=tmpdir,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        # 4. Tareas para leer stdout y stderr
        stdout_task = asyncio.create_task(_read_stream(proc.stdout, websocket, "stdout", tmpdir))
        stderr_task = asyncio.create_task(_read_stream(proc.stderr, websocket, "error", tmpdir))

        # 5. Tarea para leer entradas del WebSocket y escribirlas en stdin del proceso
        async def _write_stdin():
            try:
                while proc.returncode is None:
                    data = await websocket.receive_text()
                    if data:
                        proc.stdin.write(data.encode('utf-8') + b'\n')
                        await proc.stdin.drain()
            except WebSocketDisconnect:
                pass
            except Exception:
                pass

        stdin_task = asyncio.create_task(_write_stdin())

        # Esperar a que el proceso termine, con timeout
        TIMEOUT = 30
        try:
            await asyncio.wait_for(proc.wait(), timeout=TIMEOUT)
        except asyncio.TimeoutError:
            proc.terminate()
            await websocket.send_text(json.dumps({"type": "error", "text": f"\n✖ Tiempo límite de {TIMEOUT}s excedido."}))

        # Esperar a que terminen de vaciarse los streams de lectura
        await asyncio.gather(stdout_task, stderr_task, return_exceptions=True)
        stdin_task.cancel()
        
        elapsed = round(time.time() - start, 3)
        if proc.returncode == 0:
            await websocket.send_text(json.dumps({"type": "success", "text": f"\n- Proceso finalizado con código 0  ({elapsed}s)"}))
        elif proc.returncode is not None:
            await websocket.send_text(json.dumps({"type": "error", "text": f"\n- Proceso finalizado con código {proc.returncode}  ({elapsed}s)"}))

    except WebSocketDisconnect:
        if proc and proc.returncode is None:
            proc.terminate()
    except Exception as e:
        if proc and proc.returncode is None:
            proc.terminate()
        try:
            await websocket.send_text(json.dumps({"type": "error", "text": f"Error interno: {str(e)}"}))
        except:
            pass
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
        try:
            await websocket.close()
        except:
            pass


# ── EVALUACIÓN DE RETOS CON CASOS DE PRUEBA ─────────────────────────────────

class RunTestsRequest(BaseModel):
    code: str
    language: str = "cpp"
    laboratory_id: str

@app.post("/api/student/run-tests")
async def run_tests(req: RunTestsRequest, x_user_id: str = Header(None), db: Session = Depends(database.get_db)):
    """Ejecuta el código del estudiante contra todos los casos de prueba del laboratorio."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Header X-User-ID faltante")

    try:
        user_uuid = UUID(x_user_id)
        lab_uuid = UUID(req.laboratory_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="UUID inválido")

    student = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
    if not student:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    lab = db.query(models.Laboratory).filter(models.Laboratory.id == lab_uuid).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratorio no encontrado")

    test_cases = db.query(models.TestCase).filter(models.TestCase.laboratory_id == lab_uuid).all()
    if not test_cases:
        return {"error": "no_tests", "message": "Este laboratorio no tiene casos de prueba para evaluar.", "results": [], "all_passed": False}

    # 1. Compilar el código UNA sola vez
    tmpdir = tempfile.mkdtemp()
    lang = req.language.lower()
    exe_cmd = []

    try:
        # Configuración base de Docker CLI
        docker_base = [
            "docker", "run", "--rm", "-i",
            "--network=none", "--pids-limit=50", "--memory=100m", "--cpus=0.5",
            "-v", f"{tmpdir}:/app:ro", "-w", "/app"
        ]

        if lang == "python":
            src = os.path.join(tmpdir, "main.py")
            with open(src, "w", encoding="utf-8") as f:
                f.write(req.code)
            exe_cmd = docker_base + ["python:3.10-alpine", "python", "-u", "main.py"]
        elif lang == "javascript":
            src = os.path.join(tmpdir, "main.js")
            with open(src, "w", encoding="utf-8") as f:
                f.write(req.code)
            exe_cmd = docker_base + ["node:18-alpine", "node", "main.js"]
        elif lang == "java":
            import re as _re
            match = _re.search(r'public\s+class\s+(\w+)', req.code)
            class_name = match.group(1) if match else "Main"
            src = os.path.join(tmpdir, f"{class_name}.java")
            with open(src, "w", encoding="utf-8") as f:
                f.write(req.code)
            # Compilar en volumen temporal (rw)
            compile_proc = await asyncio.create_subprocess_exec(
                "docker", "run", "--rm", "-v", f"{tmpdir}:/app", "-w", "/app", "openjdk:17-alpine", "javac", f"{class_name}.java",
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            _, stderr = await compile_proc.communicate()
            if compile_proc.returncode != 0:
                raw_err = stderr.decode('utf-8', errors='replace').replace("/app/", "")
                return {"error": "compilation", "message": raw_err, "results": [], "all_passed": False}
            exe_cmd = docker_base + ["openjdk:17-alpine", "java", class_name]
        elif lang == "cpp":
            src = os.path.join(tmpdir, "main.cpp")
            with open(src, "w", encoding="utf-8") as f:
                f.write(req.code)
            compile_proc = await asyncio.create_subprocess_exec(
                "docker", "run", "--rm", "-v", f"{tmpdir}:/app", "-w", "/app", "gcc:12", "g++", "main.cpp", "-o", "a.out",
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            _, stderr = await compile_proc.communicate()
            if compile_proc.returncode != 0:
                raw_err = stderr.decode('utf-8', errors='replace').replace("/app/", "")
                return {"error": "compilation", "message": raw_err, "results": [], "all_passed": False}
            exe_cmd = docker_base + ["gcc:12", "./a.out"]
        elif lang == "bash":
            src = os.path.join(tmpdir, "main.sh")
            with open(src, "w", encoding="utf-8") as f:
                f.write(req.code)
            exe_cmd = docker_base + ["bash:5-alpine", "bash", "main.sh"]
        else:
            raise HTTPException(status_code=400, detail=f"Lenguaje no soportado: {lang}")

        # 2. Ejecutar contra cada caso de prueba (CONCURRENTE)
        async def run_single_test(i, tc):
            try:
                proc = await asyncio.create_subprocess_exec(
                    *exe_cmd, cwd=tmpdir,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                try:
                    input_bytes = tc.input_data.encode('utf-8') if tc.input_data else b""
                    stdout, stderr = await asyncio.wait_for(
                        proc.communicate(input=input_bytes),
                        timeout=10
                    )
                except asyncio.TimeoutError:
                    proc.terminate()
                    return {
                        "case_number": i + 1,
                        "passed": False,
                        "is_hidden": tc.is_hidden,
                        "input": None if tc.is_hidden else tc.input_data,
                        "expected": None if tc.is_hidden else tc.expected_output,
                        "actual": "⏱ Tiempo límite excedido (10s)",
                        "error": None,
                    }

                actual_output = stdout.decode('utf-8', errors='replace').strip()
                expected_output = tc.expected_output.strip()
                passed = actual_output == expected_output

                return {
                    "case_number": i + 1,
                    "passed": passed,
                    "is_hidden": tc.is_hidden,
                    "input": None if tc.is_hidden else tc.input_data,
                    "expected": None if tc.is_hidden else tc.expected_output,
                    "actual": None if tc.is_hidden else actual_output,
                    "error": stderr.decode('utf-8', errors='replace').strip() if stderr and not passed else None,
                }
            except Exception as e:
                return {
                    "case_number": i + 1,
                    "passed": False,
                    "is_hidden": tc.is_hidden,
                    "input": None if tc.is_hidden else tc.input_data,
                    "expected": None if tc.is_hidden else tc.expected_output,
                    "actual": f"Error: {str(e)}",
                    "error": str(e),
                }

        tasks = [run_single_test(i, tc) for i, tc in enumerate(test_cases)]
        results = await asyncio.gather(*tasks)

        all_passed = all(r["passed"] for r in results)
        passed_count = sum(1 for r in results if r["passed"])
        total_count = len(results)

        # 3. Guardar intento con resultado
        try:
            prev_attempts = db.query(models.Attempt).filter(
                models.Attempt.student_id == user_uuid,
                models.Attempt.laboratory_id == lab_uuid
            ).count()
            attempt = models.Attempt(
                student_id=user_uuid,
                laboratory_id=lab_uuid,
                code_snapshot=req.code,
                student_intention=f"Evaluación: {passed_count}/{total_count} casos pasados",
                ai_feedback=f"{'✅ APROBADO' if all_passed else '❌ NO APROBADO'}: {passed_count}/{total_count} casos de prueba superados.",
                attempt_number=prev_attempts + 1,
            )
            db.add(attempt)
            db.commit()
        except Exception as e:
            print(f"Error saving test attempt: {e}")

        return {
            "error": None,
            "all_passed": all_passed,
            "passed_count": passed_count,
            "total_count": total_count,
            "results": results,
        }

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

# ── ASISTENTE SOCRÁTICO (Gemini AI) ──────────────────────────────────────────

@app.post("/api/student/assistant")
def ask_assistant(req: AssistantRequest, x_user_id: str = Header(None), db: Session = Depends(database.get_db)):
    active_model = get_setting(db, "ACTIVE_MODEL", _GEMINI_MODEL)
    is_openai = active_model.lower().startswith("gpt") or active_model.lower().startswith("o1")

    if is_openai:
        api_key = get_setting(db, "OPENAI_API_KEY")
        provider_name = "OpenAI"
    else:
        api_key = get_setting(db, "GEMINI_API_KEY")
        provider_name = "Google Gemini"

    if not api_key or api_key.strip() == "":
        raise HTTPException(
            status_code=503,
            detail=f"El asistente no está disponible: el motor activo requiere una API Key de {provider_name}. Configúrala en el panel de administrador."
        )

    if not req.messages:
        raise HTTPException(status_code=400, detail="Se requiere al menos un mensaje.")

    # Preparar historial (mensajes previos)
    contents = []
    for msg in req.messages[:-1]:
        contents.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [{"text": msg.text}]
        })

    last_msg = req.messages[-1].text

    # Preparar el prompt con contexto de código y consola
    context_prefix = ""
    code_context = ""
    console_context = ""

    if req.code and req.code.strip():
        lang_label = (req.language or "código").upper()
        code_context = (
            f"[CÓDIGO ACTUAL DEL ESTUDIANTE en {lang_label}]:\n"
            f"```{req.language or ''}\n{req.code}\n```\n\n"
        )
    
    if req.terminal_output and req.terminal_output.strip():
        console_context = (
            f"[SALIDA DE LA CONSOLA / ERRORES]:\n"
            f"```\n{req.terminal_output}\n```\n\n"
        )

    if code_context or console_context:
        context_prefix = (
            f"--- CONTEXTO DE EJECUCIÓN ---\n"
            f"{code_context}"
            f"{console_context}"
            f"[PREGUNTA DEL ESTUDIANTE]: "
        )

    full_prompt = context_prefix + last_msg

    # Añadir el mensaje actual con el contexto al historial para la IA
    contents.append({
        "role": "user",
        "parts": [{"text": full_prompt}]
    })

    # Buscar contexto adicional en RAG (Conocimiento de la EPIS)
    rag_context = ""
    try:
        import chroma_service
        search_query = last_msg
        if req.code and req.code.strip():
            search_query = f"{last_msg} {req.code[:200]}"
        # Pasamos la api_key activa para que los embeddings funcionen con la misma cuenta
        rag_results = chroma_service.query_knowledge(search_query, n_results=3, api_key=api_key)
        if rag_results:
            fragments = "\n---\n".join([
                f"[{r['title']}]: {r['text']}" for r in rag_results
            ])
            rag_context = (
                "\n\n[MATERIAL DE REFERENCIA INSTITUCIONAL — Tienes permiso explícito para usar "
                "este conocimiento para responder directamente al estudiante si su pregunta es general o "
                "sobre la institución/plataforma. Si es de código, guíalo socráticamente]:\n"
                f"{fragments}\n"
            )
    except Exception:
        pass

    system_with_rag = get_system_prompt() + rag_context
    if is_openai:
        try:
            import openai
            client = openai.OpenAI(api_key=api_key)
            oa_messages = [{"role": "system", "content": system_with_rag}]
            for m in contents:
                role = "assistant" if m["role"] == "model" else "user"
                oa_messages.append({"role": role, "content": m["parts"][0]["text"]})

            response = client.chat.completions.create(
                model=active_model,
                messages=oa_messages,
                temperature=0.7,
                timeout=5.0
            )
            reply = response.choices[0].message.content.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error de OpenAI: {str(e)}")
            
    else:
        # Lógica para Google Gemini
        try:
            dynamic_client = _genai.Client(api_key=api_key, http_options={'api_version': 'v1beta', 'timeout': 5000})
            response = dynamic_client.models.generate_content(
                model=active_model,
                contents=contents,
                config=_gtypes.GenerateContentConfig(
                    system_instruction=system_with_rag,
                    temperature=0.7
                )
            )
            reply_raw = response.text.strip()
            # Limpiar backticks de markdown si el modelo los añade
            if reply_raw.startswith("```"):
                reply_raw = re.sub(r'^```[a-z]*\n?', '', reply_raw)
                reply_raw = re.sub(r'\n?```$', '', reply_raw.strip())
            reply = reply_raw
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error de Gemini: {str(e)}")

    # Intentar parsear el JSON estructurado de la IA
    try:
        parsed = json.loads(reply)
        ai_text = parsed.get("text", reply)
        interaction = parsed.get("interaction", None)
        quick_replies = parsed.get("quick_replies", [])
    except (json.JSONDecodeError, AttributeError):
        # Si la IA no devuelve JSON válido, retornar como texto plano
        ai_text = reply
        interaction = None
        quick_replies = []

    # Guardar en base de datos el intento con feedback de la IA
    try:
        if x_user_id:
            student_uuid = UUID(x_user_id)
            lab_uuid = UUID(req.laboratory_id) if req.laboratory_id else None
            
            q = db.query(models.Attempt).filter(models.Attempt.student_id == student_uuid)
            if lab_uuid:
                q = q.filter(models.Attempt.laboratory_id == lab_uuid)
            prev_attempts = q.count()
            
            attempt = models.Attempt(
                student_id=student_uuid,
                laboratory_id=lab_uuid,
                code_snapshot=req.code or "",
                student_intention=last_msg,
                ai_feedback=ai_text,
                attempt_number=prev_attempts + 1
            )
            db.add(attempt)
            db.commit()
    except Exception as e:
        print("Error saving ai attempt:", e)

    return {"reply": ai_text, "interaction": interaction, "quick_replies": quick_replies}
