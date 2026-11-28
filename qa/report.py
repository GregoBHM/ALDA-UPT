"""Publica el estado por caso a partir de los resultados JUnit de esta ejecución."""
import argparse
import csv
import os
import re
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree


CASE_ID = re.compile(r"\bcp[-_]?(\d{2,3})\b", re.IGNORECASE)


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
            checks[case_id].append((status, scope))
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("backend", type=Path)
    parser.add_argument("browser", type=Path)
    parser.add_argument("report_dir", type=Path)
    args = parser.parse_args()

    catalog_path = Path(__file__).with_name("catalogo.csv")
    with catalog_path.open(encoding="utf-8", newline="") as source:
        catalog = list(csv.DictReader(source))

    checks = defaultdict(list)
    storage = "PostgreSQL" if os.environ.get("ALDA_TEST_DATABASE_URL") else "SQLite"
    backend_available = read_results(args.backend, f"Backend, entorno {storage}", checks)
    browser_available = read_results(args.browser, "Chromium, API simulada", checks)
    by_status = Counter()
    rows = []
    for entry in catalog:
        verification = checks[entry["id"]]
        scopes = ", ".join(sorted({scope for _, scope in verification}))
        count = Counter(status for status, _ in verification)
        status = next(
            (value for value in ("Falla", "Falla esperada", "Omitida", "Aprobada") if count[value]),
            "Sin ejecución registrada",
        )
        by_status[status] += 1
        rows.append({
            **entry,
            "estado_ci": status,
            "verificaciones": len(verification),
            "alcance": scopes,
        })

    args.report_dir.mkdir(parents=True, exist_ok=True)
    with (args.report_dir / "resultados.csv").open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    lines = [
        "# Pruebas de ALDA-UPT", "",
        f"Casos del catálogo: **{len(catalog)}**. Casos con resultados: **{sum(bool(row['verificaciones']) for row in rows)}**.",
        "",
        "Cada resultado describe las verificaciones de CI asociadas al caso. La aprobación de una "
        "verificación puede cubrir solo una parte del escenario documentado.",
        "",
        f"- Backend: {'JUnit disponible' if backend_available else 'sin informe JUnit'}.",
        f"- Navegador: {'JUnit disponible' if browser_available else 'sin informe JUnit'}.",
        "",
    ]
    lines.extend(f"- {status}: {total}" for status, total in by_status.items())
    lines.extend(["", "| Caso | Tipo | Estado de CI | Verificaciones | Alcance |", "| --- | --- | --- | ---: | --- |"])
    for row in rows:
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
