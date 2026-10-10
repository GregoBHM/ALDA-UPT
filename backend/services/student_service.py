from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

import models


class StudentService:

    def get_dashboard(self, db: Session, email: str) -> dict:
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

    def get_all_labs(self, db: Session) -> list:
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

    def get_progress(self, db: Session, email: str) -> dict:
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
        solved_labs_ids = set(
            a.laboratory_id for a in all_attempts
            if a.ai_feedback and "✅ APROBADO" in a.ai_feedback
        )
        total_labs = db.query(models.Laboratory).count()
        solved_count = len(solved_labs_ids)

        recent = [
            {
                "id": str(a.id),
                "laboratory_id": str(a.laboratory_id) if a.laboratory_id else None,
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

    def rate_attempt(self, db: Session, student_id: str, attempt_id: str, rating: int, comment: str) -> dict:
        if rating not in (1, -1):
            raise HTTPException(status_code=400, detail="El rating debe ser 1 (útil) o -1 (no útil).")
        try:
            attempt_uuid = UUID(attempt_id)
            user_uuid = UUID(student_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="ID inválido.")
        attempt = db.query(models.Attempt).filter(
            models.Attempt.id == attempt_uuid,
            models.Attempt.student_id == user_uuid
        ).first()
        if not attempt:
            raise HTTPException(status_code=404, detail="Intento no encontrado.")
        attempt.ai_rating = rating
        attempt.ai_rating_comment = comment
        db.commit()
        return {"detail": "Calificación registrada.", "rating": rating}

    def get_announcements(self, db: Session) -> list:
        items = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).limit(5).all()
        return [{"id": str(a.id), "title": a.title, "content": a.content, "created_at": a.created_at} for a in items]
