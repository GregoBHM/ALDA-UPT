"""Pruebas de integración de aulas, progreso y reportes con datos aislados."""
from datetime import datetime, timezone
from io import BytesIO

import pytest
from openpyxl import load_workbook

import models


@pytest.fixture
def lab(db, users):
    lab = models.Laboratory(title="Sumar números", teacher_id=users["teacher"].id, difficulty="easy")
    db.add(lab)
    db.flush()
    db.add_all([
        models.Attempt(
            student_id=users["student"].id, laboratory_id=lab.id,
            code_snapshot="print(2)", ai_feedback="✅ APROBADO",
            created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
        ),
        models.Attempt(
            student_id=users["other_student"].id, laboratory_id=lab.id,
            code_snapshot="print(3)", ai_feedback="Error de sintaxis",
            created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        ),
    ])
    db.commit()
    return lab


def test_cp11_cp13_cp14_progreso_agrupa_e_isla_intentos(api, db, lab, users):
    student = users["student"]
    other_student = users["other_student"]
    own_attempt = db.query(models.Attempt).filter_by(student_id=student.id).one()
    with api(student) as client:
        progress = client.get(f"/api/student/progress/{other_student.email}")
    assert progress.status_code == 200
    data = progress.json()
    assert data["total_attempts"] == 1
    assert data["solved_count"] == 1
    assert data["total_labs"] == 1
    assert [item["id"] for item in data["recent_activity"]] == [str(own_attempt.id)]


def test_cp36_calificacion_se_guarda_solo_para_el_propio_intento(api, db, lab, users):
    attempt = db.query(models.Attempt).filter_by(student_id=users["student"].id).one()
    path = f"/api/student/attempts/{attempt.id}/rate"
    with api(users["other_student"]) as other:
        assert other.put(path, json={"rating": 1, "comment": "QA"}).status_code == 404
    with api(users["student"]) as client:
        assert client.put(path, json={"rating": 5}).status_code in (400, 422)
        response = client.put(path, json={"rating": 1, "comment": "QA"})
    assert response.status_code == 200
    db.refresh(attempt)
    assert attempt.ai_rating == 1
    assert attempt.ai_rating_comment == "QA"


@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("POST", "/api/teacher/announcements", {"title": "Aviso", "content": "Aviso para el aula"}),
        ("GET", "/api/teacher/stats", None),
        ("GET", "/api/teacher/error-analytics", None),
        ("POST", "/api/teacher/knowledge", {"title": "Material", "content": "Apuntes de QA"}),
        ("DELETE", "/api/teacher/knowledge/knowledge_qa", None),
        ("GET", "/api/teacher/reports/export-excel", None),
    ],
    ids=["cp48-cp73", "cp53", "cp58", "cp83", "cp88", "cp93"],
)
def test_acceso_docente_restringido(api, users, method, path, payload):
    with api(users["student"]) as client:
        assert client.request(method, path, json=payload).status_code == 403
    with api() as client:
        assert client.request(method, path, json=payload).status_code == 401


def test_cp49_cp74_cp78_cp79_anuncio_publicado_y_retirado(api, users):
    payload = {"title": "Aviso QA", "content": "Material de la próxima clase"}
    with api(users["teacher"]) as teacher, api(users["student"]) as student:
        published = teacher.post("/api/teacher/announcements", json=payload)
        assert published.status_code == 200
        announcement_id = published.json()["id"]
        own_announcements = teacher.get("/api/teacher/announcements").json()
        assert any(item["id"] == announcement_id for item in own_announcements)
        announcements = student.get("/api/student/announcements").json()
        assert [(item["id"], item["content"]) for item in announcements] == [(announcement_id, payload["content"])]

        path = f"/api/teacher/announcements/{announcement_id}"
        with api(users["other_teacher"]) as other:
            assert other.delete(path).status_code == 404
        assert teacher.delete(path).status_code == 200
        assert student.get("/api/student/announcements").json() == []


def test_cp51_cp54_estadisticas_calculadas_con_intentos_persistidos(api, lab, users):
    with api(users["teacher"]) as teacher:
        response = teacher.get("/api/teacher/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_students"] == 2
    assert data["total_labs"] == 1
    assert data["total_attempts"] == 2


def test_cp56_cp59_analisis_agrupa_errores_desde_el_historial(api, lab, users):
    with api(users["teacher"]) as teacher:
        response = teacher.get("/api/teacher/error-analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_analyzed"] == 2
    assert {"pattern": "Errores de sintaxis", "count": 1} in data["error_patterns"]


def test_cp28_cp64_casos_ocultos_se_excluyen_del_catalogo(api, users):
    cases = [
        {"input_data": "1 2", "expected_output": "3"},
        {"input_data": "9 1", "expected_output": "10", "is_hidden": True},
    ]
    with api(users["teacher"]) as teacher:
        created = teacher.post("/api/teacher/labs", json={"title": "Sumar", "test_cases": cases})
        assert created.status_code == 200
    with api(users["student"]) as student:
        response = student.get("/api/student/labs")
    assert response.status_code == 200
    visible, = response.json()
    assert visible["id"] == created.json()["id"]
    assert visible["test_cases"] == cases[:1]
    assert visible["total_test_cases"] == 2


def test_cp66_cp68_cp69_eliminar_propio_y_borrar_intentos_asociados(api, db, lab, users):
    lab_id = lab.id
    db.add(models.TestCase(laboratory_id=lab_id, input_data="1", expected_output="1"))
    db.commit()
    path = f"/api/teacher/labs/{lab_id}"
    with api(users["other_teacher"]) as other:
        assert other.delete(path).status_code == 403
    assert db.query(models.Attempt).filter_by(laboratory_id=lab_id).count() == 2
    with api(users["teacher"]) as teacher:
        assert teacher.delete(path).status_code == 200
    assert db.query(models.Attempt).filter_by(laboratory_id=lab_id).count() == 0
    assert db.query(models.TestCase).filter_by(laboratory_id=lab_id).count() == 0


def test_cp81_acepta_solo_extension_pdf_y_rechaza_pdf_corrupto(api, users):
    with api(users["teacher"]) as teacher:
        path = "/api/teacher/knowledge/upload-pdf"
        for file, status in [("apunte.txt", 400), ("apunte.pdf", 422)]:
            response = teacher.post(path, data={"title": "QA"}, files={"file": (file, b"contenido invalido")})
            assert response.status_code == status


def test_cp91_cp94_reporte_excel_refleja_intentos_persistidos(api, lab, users):
    with api(users["teacher"]) as teacher:
        response = teacher.get("/api/teacher/reports/export-excel")
    assert response.status_code == 200
    assert response.headers["content-type"].endswith("spreadsheetml.sheet")
    workbook = load_workbook(BytesIO(response.content), read_only=True)
    try:
        rows = list(workbook["Intentos Detallados"].values)
        assert [(row[1], row[2], row[5]) for row in rows[1:]] == [
            (users["student"].email, lab.title, "Sí"),
            (users["other_student"].email, lab.title, "No"),
        ]
    finally:
        workbook.close()


@pytest.mark.parametrize(
    ("title", "content"),
    [("", "Aviso válido de QA"), ("   ", "Aviso válido de QA"), ("Aviso QA", "Corto")],
    ids=["titulo-vacio", "titulo-espacios", "contenido-corto"],
)
@pytest.mark.xfail(strict=True, raises=AssertionError, reason="El esquema acepta anuncios inválidos.")
def test_cp46_rechaza_anuncios_invalidos(api, users, title, content):
    with api(users["teacher"]) as teacher:
        response = teacher.post("/api/teacher/announcements", json={"title": title, "content": content})
    assert response.status_code == 422


@pytest.mark.xfail(strict=True, raises=AssertionError, reason="El esquema permite retos sin casos de prueba.")
def test_cp63_laboratorio_requiere_como_minimo_un_caso(api, users):
    with api(users["teacher"]) as teacher:
        response = teacher.post("/api/teacher/labs", json={"title": "Reto sin casos", "test_cases": []})
    assert response.status_code == 422
