# Network diagnostics assistant
#
# This project provides a legitimate, authorized network monitoring scaffold for:
# - OLT / ONU / PON diagnostics
# - MikroTik router health tracking
# - WiFi quality and interference checks
# - root-cause classification for intermittent network drops
#
# It is intended for monitoring networks you own or administer.
#
# Features:
# - English and Bangla language support
# - Demo snapshot parsing
# - Fault classification and reports
# - API-ready diagnostics output

from __future__ import annotations

from network_diag.collectors import build_demo_snapshot
from network_diag.reporting import generate_report
from network_diag.rules import classify_faults, summarize_network_health


def run_diagnostics(language: str = "en") -> str:
    snapshot = build_demo_snapshot()
    issues = classify_faults(snapshot)
    summary = summarize_network_health(snapshot, language=language)
    report = generate_report(snapshot, issues, language=language)
    return f"{summary}\n\n{report}"


if __name__ == "__main__":
    print(run_diagnostics("en"))
    print("\n--- Bangla ---\n")
    print(run_diagnostics("bn"))
