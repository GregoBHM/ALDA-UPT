import datetime
import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

import models


class TeacherService:

    def get_announcements(self, db: Session, teacher_id, is_admin: bool) -> list:
        if is_admin:
            items = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()
        else:
            items = db.query(models.Announcement).filter(
                models.Announcement.teacher_id == teacher_id
            ).order_by(models.Announcement.created_at.desc()).all()
        return [{"id": str(a.id), "title": a.title, "content": a.content, "created_at": a.created_at} for a in items]

    def create_announcement(self, db: Session, teacher_id, title: str, content: str) -> dict:
        ann = models.Announcement(teacher_id=teacher_id, title=title, content=content)
        db.add(ann)
        db.commit()
        db.refresh(ann)
        return {"id": str(ann.id), "title": ann.title, "content": ann.content, "created_at": ann.created_at}

    def delete_announcement(self, db: Session, teacher_id, announcement_id: str, is_admin: bool) -> dict:
        try:
            ann_uuid = UUID(announcement_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID inválido.")
        if is_admin:
            ann = db.query(models.Announcement).filter(models.Announcement.id == ann_uuid).first()
        else:
            ann = db.query(models.Announcement).filter(
                models.Announcement.id == ann_uuid,
                models.Announcement.teacher_id == teacher_id
            ).first()
        if not ann:
            raise HTTPException(status_code=404, detail="Anuncio no encontrado.")
        db.delete(ann)
        db.commit()
        return {"detail": "Anuncio eliminado."}

    def get_stats(self, db: Session) -> dict:
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

    def get_error_analytics(self, db: Session) -> dict:
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

    def export_excel_report(self, db: Session):
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

        df_attempts = pd.DataFrame(rows) if rows else pd.DataFrame(
            columns=["Estudiante", "Correo", "Laboratorio", "N° Intento", "Usó Asistente IA", "Aprobado", "Calificación IA", "Fecha"]
        )

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

        per_lab_rows = []
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

    def get_labs(self, db: Session, teacher_id, is_admin: bool) -> list:
        if is_admin:
            labs = db.query(models.Laboratory).all()
        else:
            labs = db.query(models.Laboratory).filter(models.Laboratory.teacher_id == teacher_id).all()
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
                "test_cases": [{
                    "id": str(tc.id),
                    "input_data": tc.input_data,
                    "expected_output": tc.expected_output,
                    "is_hidden": tc.is_hidden,
                    "evaluation_type": tc.evaluation_type or "exact"
                } for tc in tcs]
            })
        return result

    def create_lab(self, db: Session, teacher_id, req) -> dict:
        lab = models.Laboratory(
            teacher_id=teacher_id,
            title=req.title,
            description=req.description,
            difficulty=req.difficulty,
            is_exam=req.is_exam
        )
        db.add(lab)
        db.flush()
        for tc in req.test_cases:
            test_case = models.TestCase(
                laboratory_id=lab.id,
                input_data=tc.input_data,
                expected_output=tc.expected_output,
                is_hidden=tc.is_hidden,
                evaluation_type=getattr(tc, 'evaluation_type', 'exact') or 'exact'
            )
            db.add(test_case)
        db.commit()
        return {"message": "Reto y casos de prueba creados", "id": str(lab.id)}

    def update_lab(self, db: Session, teacher_id, lab_id: str, req, is_admin: bool) -> dict:
        try:
            lab_uuid = UUID(lab_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID inválido")
        lab = db.query(models.Laboratory).filter(models.Laboratory.id == lab_uuid).first()
        if not lab:
            raise HTTPException(status_code=404, detail="Laboratorio no encontrado")
        if not is_admin and str(lab.teacher_id) != str(teacher_id):
            raise HTTPException(status_code=403, detail="No tienes permiso para editar este laboratorio")

        lab.title = req.title
        lab.description = req.description
        lab.difficulty = req.difficulty
        lab.is_exam = req.is_exam

        # Replace all test cases atomically
        db.query(models.TestCase).filter(models.TestCase.laboratory_id == lab_uuid).delete()
        for tc in req.test_cases:
            test_case = models.TestCase(
                laboratory_id=lab.id,
                input_data=tc.input_data,
                expected_output=tc.expected_output,
                is_hidden=tc.is_hidden,
                evaluation_type=getattr(tc, 'evaluation_type', 'exact') or 'exact'
            )
            db.add(test_case)
        db.commit()
        return {"message": "Laboratorio actualizado", "id": str(lab.id)}

    def delete_lab(self, db: Session, teacher_id, lab_id: str, is_admin: bool) -> dict:
        try:
            lab_uuid = UUID(lab_id)
        except:
            raise HTTPException(status_code=400, detail="ID inválido")
        lab = db.query(models.Laboratory).filter(models.Laboratory.id == lab_uuid).first()
        if not lab:
            raise HTTPException(status_code=404, detail="Laboratorio no encontrado")
        if not is_admin and str(lab.teacher_id) != str(teacher_id):
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este laboratorio")
        db.delete(lab)
        db.commit()
        return {"message": "Laboratorio eliminado"}
