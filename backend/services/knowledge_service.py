import datetime
import uuid as uuid_mod
import os
from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pathlib import Path

import models
import chroma_service

UPLOADS_DIR = Path(__file__).parent.parent / "uploads" / "knowledge"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


class KnowledgeService:

    def get_items(self, db: Session) -> list:
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
                "pdf_file": val.get("pdf_file"),
                "updated_at": item.updated_at.isoformat() if item.updated_at else None,
            })
        return result

    def add_item(self, db: Session, title: str, content: str, teacher_id) -> dict:
        key = f"knowledge_{uuid_mod.uuid4().hex[:8]}"

        try:
            num_chunks = chroma_service.add_document(key, title, content)
        except Exception as e:
            print(f"[ALDA RAG] ⚠ Error al indexar texto en ChromaDB: {e}")
            num_chunks = 0

        item = models.SystemConfig(
            key=key,
            value={"title": title, "content": content, "source": "text", "chunks": num_chunks},
            description=f"Conocimiento RAG: {title}",
            updated_by=teacher_id,
            updated_at=datetime.datetime.now(datetime.timezone.utc),
        )
        db.add(item)
        db.commit()
        return {"message": "Conocimiento guardado exitosamente", "key": key, "chunks_created": num_chunks}

    def upload_pdf(self, db: Session, filename: str, title: str, content_bytes: bytes, teacher_id) -> dict:
        MAX_PDF_SIZE_MB = 100
        MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024

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

        key = f"knowledge_{uuid_mod.uuid4().hex[:8]}"

        try:
            num_chunks = chroma_service.add_document(key, title, full_text)
        except Exception as e:
            print(f"[ALDA RAG] ⚠ Error al indexar PDF en ChromaDB: {e}")
            num_chunks = 0

        # --- Guardar copia física del PDF ---
        pdf_filename = f"{key}.pdf"
        pdf_path = UPLOADS_DIR / pdf_filename
        with open(pdf_path, "wb") as f:
            f.write(content_bytes)

        preview = full_text[:500] + ("..." if len(full_text) > 500 else "")
        item = models.SystemConfig(
            key=key,
            value={
                "title": title,
                "content": preview,
                "source": "pdf",
                "filename": filename,
                "pdf_file": pdf_filename,
                "chunks": num_chunks,
                "total_chars": len(full_text),
            },
            description=f"PDF RAG: {title} ({filename})",
            updated_by=teacher_id,
            updated_at=datetime.datetime.now(datetime.timezone.utc),
        )
        db.add(item)
        db.commit()

        return {
            "message": "PDF procesado y vectorizado exitosamente",
            "key": key,
            "filename": filename,
            "chunks_created": num_chunks,
            "total_chars": len(full_text),
        }

    def delete_item(self, db: Session, key: str) -> dict:
        try:
            chroma_service.delete_document(key)
        except Exception:
            pass

        item = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
        if not item:
            raise HTTPException(status_code=404, detail="Ítem no encontrado")
        db.delete(item)
        db.commit()
        return {"message": "Conocimiento eliminado de la BD y del vector store"}
