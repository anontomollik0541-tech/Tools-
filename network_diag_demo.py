from __future__ import annotations

from typing import Any, Dict, List

from .i18n import t
from .models import FaultEvent, NetworkSnapshot


def generate_report(snapshot: Dict[str, Any] | NetworkSnapshot, issues: List[FaultEvent], language: str = "en") -> str:
    if isinstance(snapshot, dict):
        snapshot_obj = NetworkSnapshot(
            timestamp=snapshot.get("timestamp", "unknown"),
            optical=[],
            wifi=[],
            routers=[],
            olt=[],
        )
    else:
        snapshot_obj = snapshot

    lines: List[str] = []
    lines.append(f"{t('report_title', language)} — {snapshot_obj.timestamp}")
    lines.append("=" * 60)

    if not issues:
        lines.append(t("no_faults", language))
        return "\n".join(lines)

    for idx, issue in enumerate(issues, start=1):
        lines.append(f"{idx}. [{issue.category.upper()} | {issue.severity.upper()}] {issue.title}")
        lines.append(f"   - {issue.detail}")
        if issue.evidence:
            evidence = ", ".join(f"{key}={value}" for key, value in issue.evidence.items())
            lines.append(f"   - Evidence: {evidence}")

    lines.append("")
    lines.append(t("recommended_action", language))
    for issue in issues:
        if issue.category == "optical":
            lines.append(f"  - {t('optical_action', language)}")
        elif issue.category == "wifi":
            lines.append(f"  - {t('wifi_action', language)}")
        elif issue.category == "router":
            lines.append(f"  - {t('router_action', language)}")
        elif issue.category == "olt":
            lines.append(f"  - {t('olt_action', language)}")
    return "\n".join(lines)
