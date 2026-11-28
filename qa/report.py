"""Agrupa los resultados automatizados de JUnit por caso de uso."""
import argparse
import csv
import os
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree

from visor import describe_verification, use_case_id, verification_details, write_viewer


CASE_ID = re.compile(r"\bcp[-_]?(\d{2,3})\b", re.IGNORECASE)
STATUSES = ("Falla", "Falla esperada", "Omitida", "Aprobada")
QA_DIR = Path(__file__).resolve().parent
RESULT_LABELS = {
    "Falla": "FAILED",
    "Falla esperada": "XFAIL",
    "Omitida": "SKIPPED",
    "Aprobada": "PASSED",
}


@dataclass(frozen=True)
class TestResult:
    name: str
    case_ids: tuple[str, ...]
    scope: str
    status: str
    duration: str
    reason: str
    output: str


def load_csv(name, key):
    with (QA_DIR / name).open(encoding="utf-8", newline="") as source:
        return {row[key]: row for row in csv.DictReader(source)}


def read_results(report, scope):
    if not report.exists():
        return None
    results = []
    for case in ElementTree.parse(report).getroot().iter("testcase"):
        name = case.get("name", "")
        module = case.get("classname", "")
        codes = CASE_ID.findall(name.replace("_", " ")) or CASE_ID.findall(module.replace("_", " "))
        case_ids = tuple(dict.fromkeys(f"CP-{int(number):02d}" for number in codes))
        problem = case.find("failure")
        if problem is None:
            problem = case.find("error")
        if problem is not None:
            status = "Falla"
        else:
            problem = case.find("skipped")
            if problem is None:
                status = "Aprobada"
            else:
                status = "Falla esperada" if problem.get("type") == "pytest.xfail" else "Omitida"

        messages = []
        reason = ""
        if problem is not None:
            reason = problem.get("message") or (problem.text or "").strip()
            if problem.text:
                messages.append(problem.text.strip())
        for tag in ("system-out", "system-err"):
            message = case.findtext(tag)
            if message and message.strip():
                messages.append(message.strip())
        results.append(TestResult(
            name=f"{module}::{name}" if module and module != "test" else name,
            case_ids=case_ids,
            scope=f"{scope}, compilador C++ en Docker" if "qa_compiler" in module else scope,
            status=status,
            duration=case.get("time", ""),
            reason=reason,
            output="\n\n".join(messages),
        ))
    return results


def markdown_cell(value):
    return (
        " ".join(value.split())
        .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        .replace("\x60", "&#96;").replace("|", "&#124;")
    )


def write_details(report_dir, results, details):
    columns = ["prueba", "casos_de_uso", "casos", "estado", "duracion_segundos", "suite", "que_verifica", "motivo", "salida"]
    with (report_dir / "pruebas-individuales.csv").open("w", encoding="utf-8", newline="") as target:
        writer = csv.writer(target)
        writer.writerow(columns)
        writer.writerows(
            [result.name, ", ".join(sorted({use_case_id(case) for case in result.case_ids})),
             ", ".join(result.case_ids), RESULT_LABELS[result.status], result.duration, result.scope,
             describe_verification(result.name, details) or "", result.reason, result.output]
            for result in results
        )


def verification_table(results):
    lines = [
        "| Verificación | Casos | Resultado | Duración (s) | Suite | Detalle |",
        "| --- | --- | --- | ---: | --- | --- |",
    ]
    for result in results:
        reason = " ".join(result.reason.split())
        if len(reason) > 200:
            reason = reason[:197] + "…"
        cells = [result.name, ", ".join(result.case_ids), RESULT_LABELS[result.status],
                 result.duration, result.scope, reason]
        lines.append("| " + " | ".join(markdown_cell(cell) for cell in cells) + " |")
    return lines


def group_cases(catalog, use_cases, checks):
    unknown = checks.keys() - catalog.keys()
    if unknown:
        raise ValueError(f"Casos sin entrada en el catálogo: {', '.join(sorted(unknown))}")
    groups = {use_case: [] for use_case in use_cases}
    for case_id, verification in sorted(checks.items()):
        use_case = use_case_id(case_id)
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
    storage = "PostgreSQL" if os.environ.get("ALDA_TEST_DATABASE_URL") else "SQLite"
    backend = read_results(args.backend, f"Backend, {storage}")
    browser = read_results(args.browser, "Chromium, API simulada")
    results = (backend or []) + (browser or [])
    checks = defaultdict(list)
    results_by_use = defaultdict(list)
    unlinked = []
    for result in results:
        if not result.case_ids:
            unlinked.append(result)
        for code in sorted({use_case_id(case_id) for case_id in result.case_ids}):
            results_by_use[code].append(result)
        for case_id in result.case_ids:
            checks[case_id].append((result.status, result.scope))
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
        f"- Backend: {'JUnit disponible' if backend is not None else 'sin informe JUnit'}.",
        f"- Navegador: {'JUnit disponible' if browser is not None else 'sin informe JUnit'}.",
        "",
        "Los resultados describen las verificaciones ejecutadas y pueden cubrir parte del escenario documentado.",
        f"[Ver las {len(planned)} pruebas previstas en el catálogo, agrupadas por caso de uso]({index_link}).",
        "",
    ]
    lines.extend(f"- {status}: {counts[status]}" for status in STATUSES if counts[status])
    write_details(args.report_dir, results, verification_details())
    lines.extend(["", "El CSV individual indica los CU de cada verificación. Las verificaciones compartidas aparecen en cada CU al que aportan evidencia."])
    on_actions = bool(os.environ.get("GITHUB_ACTIONS"))

    for code, case in use_cases.items():
        lines.extend(["", f"## {code} · {case['caso_de_uso']}", ""])
        if on_actions:
            print(f"::group::{code} · {case['caso_de_uso']}")
            for result in results_by_use[code]:
                print(f"{RESULT_LABELS[result.status]:7}  {', '.join(result.case_ids)}  {result.name}")
            if not results_by_use[code]:
                print("Sin verificaciones registradas.")
            print("::endgroup::")
        if not groups[code]:
            lines.append("Sin verificaciones automatizadas registradas en esta ejecución.")
            continue
        lines.extend(["| Caso de prueba | Tipo | Estado | Verificaciones | Alcance |", "| --- | --- | --- | ---: | --- |"])
        for row in groups[code]:
            lines.append(
                f"| {row['id']} · {row['caso']} | {row['tipo']} | {row['estado_ci']} | "
                f"{row['verificaciones']} | {row['alcance']} |"
            )

        lines.extend(["", "<details>", "<summary>Verificaciones individuales</summary>", "",
                      *verification_table(results_by_use[code]), "", "</details>"])

    if unlinked:
        lines.extend(["", "## Verificaciones sin CU asignado", "", *verification_table(unlinked)])
    summary = "\n".join(lines) + "\n"
    write_viewer(args.report_dir / "index.html", catalog, use_cases, results, RESULT_LABELS)
    (args.report_dir / "resumen.md").write_text(summary, encoding="utf-8")
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as target:
            target.write(summary)


if __name__ == "__main__":
    main()
