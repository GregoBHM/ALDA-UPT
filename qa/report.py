"""Agrupa los resultados automatizados de JUnit por caso de uso."""
import argparse
import csv
import os
import re
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree


CASE_ID = re.compile(r"\bcp[-_]?(\d{2,3})\b", re.IGNORECASE)
STATUSES = ("Falla", "Falla esperada", "Omitida", "Aprobada")
QA_DIR = Path(__file__).resolve().parent


def load_csv(name, key):
    with (QA_DIR / name).open(encoding="utf-8", newline="") as source:
        return {row[key]: row for row in csv.DictReader(source)}


def read_results(report, scope, checks):
    if not report.exists():
        return False
    for case in ElementTree.parse(report).getroot().iter("testcase"):
        name = case.get("name", "")
        ids = {f"CP-{int(number):02d}" for number in CASE_ID.findall(name.replace("_", " "))}
        skipped = case.find("skipped")
        if case.find("failure") is not None or case.find("error") is not None:
            status = "Falla"
        elif skipped is not None:
            status = "Falla esperada" if skipped.get("type") == "pytest.xfail" else "Omitida"
        else:
            status = "Aprobada"
        for case_id in ids:
            case_scope = f"{scope}, compilador C++ en Docker" if "qa_compiler" in case.get("classname", "") else scope
            checks[case_id].append((status, case_scope))
    return True


def group_cases(catalog, use_cases, checks):
    unknown = checks.keys() - catalog.keys()
    if unknown:
        raise ValueError(f"Casos sin entrada en el catálogo: {', '.join(sorted(unknown))}")
    groups = {use_case: [] for use_case in use_cases}
    for case_id, verification in sorted(checks.items()):
        number = int(case_id.split("-")[1])
        use_case = f"CU-{(number - 1) // 5 + 1:02d}"
        statuses = {status for status, _ in verification}
        groups[use_case].append({
            "cu": use_case,
            "modulo": use_cases[use_case]["modulo"],
            **catalog[case_id],
            "estado_ci": next(status for status in STATUSES if status in statuses),
            "verificaciones": len(verification),
            "alcance": ", ".join(sorted({scope for _, scope in verification})),
        })
    return groups


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("backend", type=Path)
    parser.add_argument("browser", type=Path)
    parser.add_argument("report_dir", type=Path)
    args = parser.parse_args()

    catalog = load_csv("catalogo.csv", "id")
    use_cases = load_csv("casos-de-uso.csv", "cu")
    checks = defaultdict(list)
    storage = "PostgreSQL" if os.environ.get("ALDA_TEST_DATABASE_URL") else "SQLite"
    backend_available = read_results(args.backend, f"Backend, {storage}", checks)
    browser_available = read_results(args.browser, "Chromium, API simulada", checks)
    groups = group_cases(catalog, use_cases, checks)
    rows = [row for group in groups.values() for row in group]
    counts = Counter(row["estado_ci"] for row in rows)
    planned = {case_id for case_id, case in catalog.items() if case["modo_documentado"] == "Automatizada"}
    planned_pending = planned - checks.keys()
    groups_reported = sum(bool(group) for group in groups.values())

    args.report_dir.mkdir(parents=True, exist_ok=True)
    columns = ["cu", "modulo", "id", "caso", "tipo", "modo_documentado", "estado_ci", "verificaciones", "alcance"]
    with (args.report_dir / "resultados.csv").open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, columns)
        writer.writeheader()
        writer.writerows(rows)

    project_link = f"https://github.com/{os.environ.get('GITHUB_REPOSITORY', 'GregoBHM/ALDA-UPT')}"
    index_link = f"{project_link}/blob/{os.environ.get('GITHUB_SHA', 'qa/automatizacion-pruebas-alda')}/qa/automatizadas.md"
    lines = [
        "# Pruebas automatizadas de ALDA-UPT", "",
        f"**{len(rows)} casos de prueba** con resultados en **{groups_reported} de {len(use_cases)} casos de uso**.",
        "",
        f"- {len(planned & checks.keys())} casos del plan automatizado con resultados y {len(planned_pending)} pendientes en esta ejecución.",
        f"- {len(checks.keys() - planned)} casos inicialmente manuales con verificaciones automatizadas.",
        f"- Backend: {'JUnit disponible' if backend_available else 'sin informe JUnit'}.",
        f"- Navegador: {'JUnit disponible' if browser_available else 'sin informe JUnit'}.",
        "",
        "Los resultados describen las verificaciones ejecutadas y pueden cubrir parte del escenario documentado.",
        f"[Ver las {len(planned)} pruebas previstas en el catálogo, agrupadas por caso de uso]({index_link}).",
        "",
    ]
    lines.extend(f"- {status}: {counts[status]}" for status in STATUSES if counts[status])
    for code, case in use_cases.items():
        lines.extend(["", f"## {code} · {case['caso_de_uso']}", ""])
        if not groups[code]:
            lines.append("Sin verificaciones automatizadas registradas en esta ejecución.")
            continue
        lines.extend(["| Caso de prueba | Tipo | Estado | Verificaciones | Alcance |", "| --- | --- | --- | ---: | --- |"])
        for row in groups[code]:
            lines.append(
                f"| {row['id']} · {row['caso']} | {row['tipo']} | {row['estado_ci']} | "
                f"{row['verificaciones']} | {row['alcance']} |"
            )

    summary = "\n".join(lines) + "\n"
    (args.report_dir / "resumen.md").write_text(summary, encoding="utf-8")
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as target:
            target.write(summary)


if __name__ == "__main__":
    main()
