from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import subprocess
import time


@dataclass(frozen=True)
class QaSuite:
    name: str
    description: str
    command: list[str]


@dataclass(frozen=True)
class QaResult:
    name: str
    description: str
    command: str
    status: str
    summary: str
    duration_seconds: float


def build_default_suites(python_executable: str) -> list[QaSuite]:
    return [
        QaSuite(
            name="sync_endpoints",
            description="Regression sync endpoint contracts",
            command=[
                python_executable,
                "-m",
                "pytest",
                "backend/tests/test_sync_endpoints.py",
                "-q",
            ],
        ),
        QaSuite(
            name="sync_core",
            description="Core sync service behavior",
            command=[
                python_executable,
                "-m",
                "pytest",
                "backend/tests/test_sync.py",
                "-q",
            ],
        ),
        QaSuite(
            name="backend_smoke_core",
            description="Auth + patients + appointments smoke",
            command=[
                python_executable,
                "-m",
                "pytest",
                "backend/tests/test_auth.py",
                "backend/tests/test_patients.py",
                "backend/tests/test_appointments.py",
                "-q",
            ],
        ),
        QaSuite(
            name="backend_regression_core",
            description="Backend core regression suite (clinical, billing, files, reports, users, backups)",
            command=[
                python_executable,
                "-m",
                "pytest",
                "backend/tests/test_auth.py",
                "backend/tests/test_patients.py",
                "backend/tests/test_professionals.py",
                "backend/tests/test_appointments.py",
                "backend/tests/test_medical_records.py",
                "backend/tests/test_files.py",
                "backend/tests/test_budgets.py",
                "backend/tests/test_payments.py",
                "backend/tests/test_reports.py",
                "backend/tests/test_users.py",
                "backend/tests/test_backups.py",
                "-q",
            ],
        ),
    ]


def extract_summary_line(output: str) -> str:
    lines = [line.strip() for line in output.splitlines() if line.strip()]
    if not lines:
        return "No output captured."
    for line in reversed(lines):
        lower = line.lower()
        if "passed" in lower or "failed" in lower or "error" in lower:
            return line
    return lines[-1]


def run_suites(
    suites: list[QaSuite],
    cwd: Path,
    run_tests: bool,
    timeout_seconds: int = 1200,
) -> list[QaResult]:
    results: list[QaResult] = []
    for suite in suites:
        command_string = " ".join(suite.command)
        if not run_tests:
            results.append(
                QaResult(
                    name=suite.name,
                    description=suite.description,
                    command=command_string,
                    status="SKIP",
                    summary="Execution skipped (run_tests=False).",
                    duration_seconds=0.0,
                )
            )
            continue

        start = time.perf_counter()
        completed = subprocess.run(
            suite.command,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
        duration = time.perf_counter() - start
        combined_output = f"{completed.stdout}\n{completed.stderr}".strip()
        results.append(
            QaResult(
                name=suite.name,
                description=suite.description,
                command=command_string,
                status="PASS" if completed.returncode == 0 else "FAIL",
                summary=extract_summary_line(combined_output),
                duration_seconds=round(duration, 2),
            )
        )
    return results


def render_markdown(
    results: list[QaResult],
    *,
    generated_at: datetime | None = None,
) -> str:
    timestamp = generated_at or datetime.now(timezone.utc)
    pass_count = len([result for result in results if result.status == "PASS"])
    fail_count = len([result for result in results if result.status == "FAIL"])
    skip_count = len([result for result in results if result.status == "SKIP"])
    total_duration = round(sum(result.duration_seconds for result in results), 2)

    lines = [
        "# QA Daily Test Status",
        "",
        f"Generated (UTC): {timestamp.isoformat()}",
        "",
        f"Summary: `{pass_count} PASS`, `{fail_count} FAIL`, `{skip_count} SKIP`, `{total_duration}s total`",
        "",
        "| Suite | Status | Duration (s) | Summary |",
        "| --- | --- | --- | --- |",
    ]
    for result in results:
        lines.append(
            f"| {result.name} | {result.status} | {result.duration_seconds} | {result.summary} |"
        )

    lines.extend(
        [
            "",
            "## Commands",
        ]
    )
    for result in results:
        lines.append(f"- `{result.command}`")

    return "\n".join(lines) + "\n"
