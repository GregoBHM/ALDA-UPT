"""Pruebas del compilador con programas C++ de prueba y datos temporales."""
import shutil

import pytest

import models
from services.compiler.compiler_service import CompilerService


pytestmark = pytest.mark.skipif(shutil.which("docker") is None, reason="Requiere Docker e imagen gcc:12")


@pytest.fixture
def evaluation_lab(db, users, tmp_path, monkeypatch):
    build_dir = tmp_path / "compiler"
    build_dir.mkdir()
    # The CI user owns this bind mount and gcc runs with capabilities dropped.
    build_dir.chmod(0o777)
    monkeypatch.setattr(CompilerService, "_make_temp_dir", staticmethod(lambda: str(build_dir)))
    lab = models.Laboratory(title="Prueba del compilador C++", teacher_id=users["teacher"].id)
    db.add(lab)
    db.flush()
    db.add_all([
        models.TestCase(laboratory_id=lab.id, input_data="2", expected_output="4"),
        models.TestCase(laboratory_id=lab.id, input_data="3", expected_output="6", is_hidden=True),
    ])
    db.commit()
    return lab.id


def evaluate(api, student, lab_id, code):
    with api(student) as client:
        return client.post("/api/student/run-tests", json={
            "laboratory_id": str(lab_id), "language": "cpp", "code": code,
        })


def test_cp21_muestra_diagnostico_de_sintaxis_y_no_ejecuta(api, users, evaluation_lab, db):
    response = evaluate(api, users["student"], evaluation_lab, "int main() { return ; }")
    assert response.status_code == 200
    result = response.json()
    assert result["error"] == "compilation"
    assert "main.cpp" in result["message"]
    assert "error:" in result["message"]
    assert result["results"] == []
    assert db.query(models.Attempt).filter_by(laboratory_id=evaluation_lab).count() == 0


@pytest.mark.parametrize("operator,expected", [("*", True), ("+", False)], ids=["correcta", "incorrecta"])
def test_cp26_cp29_evaluacion_registra_el_veredicto_en_historial(api, users, evaluation_lab, db, operator, expected):
    code = (
        "#include <iostream>\n"
        f"int main() {{ int n; std::cin >> n; std::cout << n {operator} 2; }}"
    )
    response = evaluate(api, users["student"], evaluation_lab, code)
    assert response.status_code == 200
    result = response.json()
    assert result["all_passed"] is expected
    assert len(result["results"]) == 2
    hidden, = [item for item in result["results"] if item["is_hidden"]]
    assert hidden["input"] is None and hidden["expected"] is None and hidden["actual"] is None
    assert hidden["passed"] is expected
    attempt = db.query(models.Attempt).filter_by(laboratory_id=evaluation_lab).one()
    assert attempt.student_id == users["student"].id
    assert attempt.code_snapshot == (code if expected else "")
    assert ("✅ APROBADO" if expected else "❌ NO APROBADO") in attempt.ai_feedback
