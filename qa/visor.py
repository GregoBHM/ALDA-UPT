"""Genera un visor estático con el catálogo y los resultados de JUnit."""
import csv
import json
import os
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parent / "visor"


def use_case_id(case_id):
    return f"CU-{(int(case_id.split('-')[1]) - 1) // 5 + 1:02d}"


def verification_details():
    return json.loads((ROOT / "verificaciones.json").read_text(encoding="utf-8"))


def describe_verification(name, details):
    method = name.rsplit("::", 1)[-1]
    return details.get(method) or details.get(method.partition("[")[0])


def source_link(result, tree_url):
    if not tree_url:
        return None
    if result.scope.startswith("Chromium"):
        return f"{tree_url}/qa/browser/flows.test.cjs"
    module = result.name.partition("::")[0]
    match = re.match(r"tests\.(test_[a-zA-Z0-9_]+)(?:\.|$)", module)
    if match:
        return f"{tree_url}/backend/tests/{match.group(1)}.py"
    return None


def write_viewer(destination, catalog, use_cases, results, result_labels):
    server = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    repository = os.environ.get("GITHUB_REPOSITORY")
    commit = os.environ.get("GITHUB_SHA", "")
    run_id = os.environ.get("GITHUB_RUN_ID")
    repo_url = f"{server}/{repository}" if repository else None
    tree_url = f"{repo_url}/blob/{commit}" if repo_url and commit else None
    details = verification_details()
    notes = json.loads((ROOT / "escenarios.json").read_text(encoding="utf-8"))
    with (ROOT / "criterios.csv").open(encoding="utf-8", newline="") as source:
        goals = {row["id"]: row["objetivo"] for row in csv.DictReader(source)}
    groups = {code: [] for code in use_cases}
    by_case = defaultdict(list)
    for result in results:
        for case_id in result.case_ids:
            by_case[case_id].append(result)

    for case_id, case in catalog.items():
        variants = by_case[case_id]
        planned = case["modo_documentado"] == "Automatizada"
        if not variants and not planned:
            continue
        use = use_case_id(case_id)
        statuses = {result.status for result in variants}
        status = next((result_labels[value] for value in result_labels if value in statuses), "Pendiente")
        groups[use].append({
            "id": case_id,
            "title": case["caso"],
            "type": case["tipo"],
            "origin": "Prevista para automatización" if planned else "Automatizada después del catálogo",
            "status": status,
            "description": notes.get(case_id) or {"expected": goals[case_id]},
            "variants": [{
                "name": result.name.partition("::")[2] or result.name,
                "explanation": describe_verification(result.name, details),
                "status": result_labels[result.status],
                "duration": result.duration,
                "scope": result.scope,
                "sourceUrl": source_link(result, tree_url),
            } for result in variants],
        })

    report = {
        "commit": commit,
        "commitUrl": f"{repo_url}/commit/{commit}" if tree_url else None,
        "runUrl": f"{repo_url}/actions/runs/{run_id}" if repo_url and run_id else None,
        "runNumber": os.environ.get("GITHUB_RUN_NUMBER", run_id),
        "counts": Counter(result_labels[result.status] for result in results),
        "uses": [{
            "id": code, "name": case["caso_de_uso"], "module": case["modulo"], "cases": groups[code],
        } for code, case in use_cases.items()],
    }
    template = (ROOT / "index.html").read_text(encoding="utf-8")
    payload = json.dumps(report, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    destination.write_text(template.replace("__ALDA_REPORT_DATA__", payload), encoding="utf-8")
