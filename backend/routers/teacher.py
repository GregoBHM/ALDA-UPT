from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
import json

import models
from core.dependencies import get_db, verify_teacher_role
from schemas.teacher import LabCreateRequest, LabUpdateRequest, AnnouncementRequest, KnowledgeItemRequest
from services.teacher_service import TeacherService
from services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/api/teacher", tags=["Docente"])

_teacher_service = TeacherService()
_knowledge_service = KnowledgeService()


@router.get("/announcements")
def get_teacher_announcements(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _teacher_service.get_announcements(db, teacher.id, teacher.role.value == "admin")


@router.post("/announcements")
def create_announcement(req: AnnouncementRequest, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _teacher_service.create_announcement(db, teacher.id, req.title, req.content)


@router.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: str, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _teacher_service.delete_announcement(db, teacher.id, announcement_id, teacher.role.value == "admin")


@router.get("/stats")
def get_teacher_stats(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _teacher_service.get_stats(db)


@router.get("/error-analytics")
def get_error_analytics(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _teacher_service.get_error_analytics(db)


@router.get("/reports/export-excel")
def export_excel_report(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    try:
        return _teacher_service.export_excel_report(db)
    except ImportError:
        raise HTTPException(status_code=500, detail="Se requiere instalar: pip install pandas openpyxl")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge")
def get_knowledge_items(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _knowledge_service.get_items(db)


@router.post("/knowledge")
def add_knowledge_item(req: KnowledgeItemRequest, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _knowledge_service.add_item(db, req.title, req.content, teacher.id)


@router.post("/knowledge/upload-pdf")
async def upload_pdf_knowledge(
    file: UploadFile = File(...),
    title: str = Form(...),
    teacher: models.DBUser = Depends(verify_teacher_role),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    content_bytes = await file.read()
    return _knowledge_service.upload_pdf(db, file.filename, title, content_bytes, teacher.id)


@router.get("/knowledge/view-pdf/{key}")
def view_knowledge_pdf(key: str, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    item = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    val = item.value if isinstance(item.value, dict) else json.loads(item.value)
    pdf_file = val.get("pdf_file")
    if not pdf_file:
        raise HTTPException(status_code=404, detail="Este ítem no tiene PDF almacenado")
    uploads_dir = Path(__file__).parent.parent / "uploads" / "knowledge"
    pdf_path = uploads_dir / pdf_file
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Archivo PDF no encontrado en el servidor")
    return FileResponse(
        str(pdf_path),
        media_type="application/pdf",
        filename=pdf_file,
        headers={"Content-Disposition": f"inline; filename=\"{pdf_file}\""}
    )


@router.delete("/knowledge/{key}")
def delete_knowledge_item(key: str, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _knowledge_service.delete_item(db, key)


@router.get("/labs")
def get_teacher_labs(teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _teacher_service.get_labs(db, teacher.id, teacher.role.value == "admin")


@router.post("/labs")
def create_teacher_lab(req: LabCreateRequest, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _teacher_service.create_lab(db, teacher.id, req)


@router.delete("/labs/{lab_id}")
def delete_teacher_lab(lab_id: str, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _teacher_service.delete_lab(db, teacher.id, lab_id, teacher.role.value == "admin")


@router.put("/labs/{lab_id}")
def update_teacher_lab(lab_id: str, req: LabUpdateRequest, teacher: models.DBUser = Depends(verify_teacher_role), db: Session = Depends(get_db)):
    return _teacher_service.update_lab(db, teacher.id, lab_id, req, teacher.role.value == "admin")
