from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from network_diag.collectors import build_demo_snapshot
from network_diag.reporting import generate_report
from network_diag.rules import classify_faults


def load_demo_snapshot(path: str | None = None) -> Dict[str, Any]:
    if path is None:
        return build_demo_snapshot()

    json_path = Path(path)
    if not json_path.exists():
        raise FileNotFoundError(f"Sample snapshot not found: {json_path}")
    return json.loads(json_path.read_text(encoding="utf-8"))


def run_network_diagnostics(path: str | None = None, language: str = "en") -> Dict[str, Any]:
    snapshot = load_demo_snapshot(path)
    issues = classify_faults(snapshot)
    report = generate_report(snapshot, issues, language=language)
    return {
        "snapshot": snapshot,
        "issues": [
            {
                "category": item.category,
                "severity": item.severity,
                "title": item.title,
                "detail": item.detail,
                "evidence": item.evidence,
            }
            for item in issues
        ],
        "report": report,
    }


def main() -> None:
    result = run_network_diagnostics(language="en")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
