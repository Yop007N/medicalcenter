#!/usr/bin/env python3
"""Wave orchestrator for continuous delivery by measurable results.

This script executes defined waves (1, 2, N), captures logs, and writes
execution reports under docs/development/wave_reports.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import textwrap
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parents[2]
REPORT_ROOT = REPO_ROOT / "docs" / "development" / "wave_reports"
LOG_ROOT = REPORT_ROOT / "logs"


@dataclass(frozen=True)
class Task:
    task_id: str
    track: str
    title: str
    command_local: str
    command_docker: str | None = None
    timeout_minutes: int = 45

    def command_for_mode(self, mode: str) -> str:
        if mode == "docker" and self.command_docker:
            return self.command_docker
        return self.command_local


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def detect_mode(preferred_mode: str) -> str:
    if preferred_mode in {"local", "docker"}:
        return preferred_mode

    command = "docker compose ps --services --status running"
    result = subprocess.run(
        command,
        cwd=REPO_ROOT,
        shell=True,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode == 0 and "backend" in result.stdout.split():
        return "docker"
    return "local"


def wave_definitions() -> dict[str, list[Task]]:
    playwright_env = (
        "LD_LIBRARY_PATH=${HOME}/.local/playwright-deps/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH}"
    )

    return {
        "1": [
            Task(
                task_id="W1-D1D2-BE",
                track="D1,D2",
                title="Backend foundation scope and scheduling checks",
                command_local=(
                    "cd backend && pytest -q "
                    "tests/test_patients.py "
                    "tests/test_appointments.py "
                    "tests/test_professionals.py "
                    "tests/test_medical_records.py"
                ),
                command_docker=(
                    "docker compose exec -T backend pytest -q "
                    "tests/test_patients.py "
                    "tests/test_appointments.py "
                    "tests/test_professionals.py "
                    "tests/test_medical_records.py"
                ),
            ),
            Task(
                task_id="W1-A-BUILDS",
                track="A",
                title="Build admin frontend",
                command_local="cd frontend-admin-profesional && npm run build",
            ),
            Task(
                task_id="W1-B-BUILDS",
                track="B",
                title="Build professional frontend",
                command_local="cd frontend-profesional && npm run build",
            ),
            Task(
                task_id="W1-C-BUILDS",
                track="C",
                title="Build patient PWA frontend",
                command_local="cd frontend-paciente && npm run build",
            ),
        ],
        "2": [
            Task(
                task_id="W2-D-SCOPE",
                track="D",
                title="Backend specialty scope and financial/files regressions",
                command_local=(
                    "cd backend && pytest -q "
                    "tests/test_budgets.py "
                    "tests/test_payments.py "
                    "tests/test_files.py "
                    "tests/integration/test_workflows.py"
                ),
                command_docker=(
                    "docker compose exec -T backend pytest -q "
                    "tests/test_budgets.py "
                    "tests/test_payments.py "
                    "tests/test_files.py "
                    "tests/integration/test_workflows.py"
                ),
            ),
            Task(
                task_id="W2-A-E2E",
                track="A",
                title="Admin specialty smoke E2E",
                command_local=(
                    "cd frontend-admin-profesional && "
                    f"{playwright_env} "
                    "BASE_URL=${BASE_URL_ADMIN:-http://127.0.0.1:4200} "
                    "npx playwright test --config=e2e/playwright.config.ts "
                    "--project=chromium --no-deps e2e/tests/critical-smoke.spec.ts "
                    "--reporter=list --output=/tmp/ms-wave-admin-results"
                ),
            ),
            Task(
                task_id="W2-B-E2E",
                track="B",
                title="Professional specialty smoke E2E",
                command_local=(
                    "cd frontend-profesional && "
                    f"{playwright_env} "
                    "BASE_URL=${BASE_URL_PROF:-http://127.0.0.1} "
                    "npx playwright test --config=e2e/playwright.config.ts "
                    "--project=chromium "
                    "--reporter=list --output=/tmp/ms-wave-prof-results"
                ),
            ),
            Task(
                task_id="W2-C-E2E",
                track="C",
                title="Patient specialty smoke E2E",
                command_local=(
                    "cd frontend-paciente && "
                    f"{playwright_env} "
                    "BASE_URL=${BASE_URL_PWA:-http://127.0.0.1:8100} "
                    "npx playwright test --config=e2e/playwright.config.ts "
                    "--project=chromium "
                    "--reporter=list --output=/tmp/ms-wave-pwa-results"
                ),
            ),
        ],
        "n": [
            Task(
                task_id="WN-MATRIX",
                track="E1",
                title="Cross-actor E2E matrix",
                command_local=(
                    "LD_LIBRARY_PATH=${HOME}/.local/playwright-deps/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH} "
                    "npm run e2e:solid"
                ),
                timeout_minutes=90,
            ),
            Task(
                task_id="WN-BE-HEALTH",
                track="E3",
                title="Backend health check",
                command_local=(
                    "curl -fsS ${BASE_URL_BACKEND:-http://127.0.0.1:5000}/health "
                    "> /tmp/medical-services-health.json && "
                    "cat /tmp/medical-services-health.json"
                ),
            ),
            Task(
                task_id="WN-FE-HEALTH",
                track="E3",
                title="Frontend endpoints smoke",
                command_local=textwrap.dedent(
                    """
                    bash -lc '
                      set -e
                      for url in "${BASE_URL_PROF:-http://127.0.0.1}" "${BASE_URL_ADMIN:-http://127.0.0.1:4200}" "${BASE_URL_PWA:-http://127.0.0.1:8100}"; do
                        code="$(curl -s -o /dev/null -w "%{http_code}" "$url")"
                        echo "$url -> $code"
                        [ "$code" -ge 200 ] && [ "$code" -lt 500 ]
                      done
                    '
                    """
                ).strip(),
            ),
        ],
    }


def resolve_requested_waves(wave_flag: str) -> list[str]:
    if wave_flag == "all":
        return ["1", "2", "n"]
    return [wave_flag]


def ensure_report_dirs() -> None:
    REPORT_ROOT.mkdir(parents=True, exist_ok=True)
    LOG_ROOT.mkdir(parents=True, exist_ok=True)


def run_task(task: Task, mode: str, dry_run: bool) -> dict:
    command = task.command_for_mode(mode)
    started_at = utc_now()

    if dry_run:
        return {
            "task_id": task.task_id,
            "track": task.track,
            "title": task.title,
            "command": command,
            "status": "DRY_RUN",
            "return_code": None,
            "started_at": started_at.isoformat(),
            "ended_at": utc_now().isoformat(),
            "duration_seconds": 0,
            "log_path": None,
            "output_tail": "",
        }

    timeout_seconds = task.timeout_minutes * 60
    result = None
    error = None
    try:
        result = subprocess.run(
            command,
            cwd=REPO_ROOT,
            shell=True,
            text=True,
            capture_output=True,
            timeout=timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        error = f"TIMEOUT after {task.timeout_minutes} minutes"
        combined = f"{exc.stdout or ''}\n{exc.stderr or ''}".strip()
        result_payload = combined
        return_code = 124
    else:
        result_payload = f"{result.stdout}\n{result.stderr}".strip()
        return_code = result.returncode

    ended_at = utc_now()
    log_name = (
        f"{started_at.strftime('%Y%m%d_%H%M%S')}_"
        f"{task.task_id.replace('/', '_').replace(' ', '_')}.log"
    )
    log_path = LOG_ROOT / log_name
    log_path.write_text(result_payload + "\n", encoding="utf-8")

    tail_lines = result_payload.splitlines()[-60:]
    status = "PASS" if error is None and return_code == 0 else "FAIL"
    if error:
        tail_lines.append(error)

    return {
        "task_id": task.task_id,
        "track": task.track,
        "title": task.title,
        "command": command,
        "status": status,
        "return_code": return_code,
        "started_at": started_at.isoformat(),
        "ended_at": ended_at.isoformat(),
        "duration_seconds": int((ended_at - started_at).total_seconds()),
        "log_path": str(log_path.relative_to(REPO_ROOT)),
        "output_tail": "\n".join(tail_lines),
    }


def write_report(
    cycles: list[dict],
    mode: str,
    selected_wave: str,
    dry_run: bool,
    continue_on_error: bool,
) -> Path:
    ensure_report_dirs()
    created_at = utc_now()
    stamp = created_at.strftime("%Y%m%d_%H%M%S")
    report_path = REPORT_ROOT / f"wave_report_{stamp}.md"
    json_path = REPORT_ROOT / f"wave_report_{stamp}.json"

    lines: list[str] = []
    lines.append("# Wave Execution Report")
    lines.append("")
    lines.append(f"- Generated at: `{created_at.isoformat()}`")
    lines.append(f"- Requested wave: `{selected_wave}`")
    lines.append(f"- Execution mode: `{mode}`")
    lines.append(f"- Dry run: `{dry_run}`")
    lines.append(f"- Continue on error: `{continue_on_error}`")
    lines.append("")

    total_tasks = 0
    passed = 0
    failed = 0

    for cycle in cycles:
        lines.append(f"## Cycle {cycle['cycle_index']}")
        lines.append("")
        lines.append(f"- Started at: `{cycle['started_at']}`")
        lines.append(f"- Ended at: `{cycle['ended_at']}`")
        lines.append("")

        for wave in cycle["waves"]:
            lines.append(f"### Wave {wave['wave']}")
            lines.append("")
            for task_result in wave["tasks"]:
                total_tasks += 1
                if task_result["status"] == "PASS":
                    passed += 1
                elif task_result["status"] == "FAIL":
                    failed += 1

                lines.append(
                    f"- `{task_result['status']}` `{task_result['task_id']}` "
                    f"({task_result['track']}): {task_result['title']}"
                )
                lines.append(f"  - Command: `{task_result['command']}`")
                lines.append(f"  - Return code: `{task_result['return_code']}`")
                lines.append(f"  - Duration (s): `{task_result['duration_seconds']}`")
                if task_result["log_path"]:
                    lines.append(f"  - Log: `{task_result['log_path']}`")
            lines.append("")

    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Total tasks: `{total_tasks}`")
    lines.append(f"- Passed: `{passed}`")
    lines.append(f"- Failed: `{failed}`")
    lines.append("")
    lines.append("## Next")
    lines.append("")
    if failed > 0:
        lines.append("- Review FAIL logs and rerun the same wave after fixes.")
    else:
        lines.append("- Move to the next backlog wave and rerun orchestrator.")

    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    json_path.write_text(json.dumps(cycles, indent=2), encoding="utf-8")
    (REPORT_ROOT / "latest.md").write_text(report_path.read_text(encoding="utf-8"), encoding="utf-8")
    (REPORT_ROOT / "latest.json").write_text(json.dumps(cycles, indent=2), encoding="utf-8")
    return report_path


def print_live_task_result(task_result: dict) -> None:
    line = (
        f"[{task_result['status']}] {task_result['task_id']} "
        f"(rc={task_result['return_code']}, {task_result['duration_seconds']}s)"
    )
    print(line)
    if task_result["status"] == "FAIL":
        print("  tail:")
        for tail_line in task_result["output_tail"].splitlines()[-10:]:
            print(f"    {tail_line}")


def execute_wave(
    wave_id: str,
    tasks: Iterable[Task],
    mode: str,
    dry_run: bool,
    continue_on_error: bool,
) -> tuple[list[dict], bool]:
    task_results: list[dict] = []
    has_failure = False

    for task in tasks:
        result = run_task(task, mode=mode, dry_run=dry_run)
        task_results.append(result)
        print_live_task_result(result)
        if result["status"] == "FAIL":
            has_failure = True
            if not continue_on_error:
                break

    return task_results, has_failure


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run delivery waves in autonomous mode.")
    parser.add_argument(
        "--wave",
        default="all",
        choices=["1", "2", "n", "all"],
        help="Wave to run: 1, 2, n or all.",
    )
    parser.add_argument(
        "--mode",
        default="auto",
        choices=["auto", "local", "docker"],
        help="Execution mode. 'auto' uses docker when backend service is running.",
    )
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Continue executing tasks even if one task fails.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be executed without running commands.",
    )
    parser.add_argument(
        "--loop",
        action="store_true",
        help="Run selected waves repeatedly in cycles.",
    )
    parser.add_argument(
        "--cycles",
        type=int,
        default=1,
        help="Number of cycles when --loop is set. Use 0 for infinite.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    resolved_mode = detect_mode(args.mode)
    waves = resolve_requested_waves(args.wave)
    wave_map = wave_definitions()

    if args.loop:
        max_cycles = args.cycles
    else:
        max_cycles = 1

    cycle_index = 0
    cycle_results: list[dict] = []
    print(f"Wave orchestrator mode: {resolved_mode}. Running waves: {', '.join(waves)}")

    while True:
        cycle_index += 1
        cycle_started = utc_now()
        wave_results: list[dict] = []
        stop_due_to_failure = False

        for wave in waves:
            tasks = wave_map[wave]
            print(f"\n=== Wave {wave} | cycle {cycle_index} ===")
            results, has_failure = execute_wave(
                wave_id=wave,
                tasks=tasks,
                mode=resolved_mode,
                dry_run=args.dry_run,
                continue_on_error=args.continue_on_error,
            )
            wave_results.append({"wave": wave, "tasks": results})
            if has_failure and not args.continue_on_error:
                stop_due_to_failure = True
                break

        cycle_ended = utc_now()
        cycle_results.append(
            {
                "cycle_index": cycle_index,
                "started_at": cycle_started.isoformat(),
                "ended_at": cycle_ended.isoformat(),
                "waves": wave_results,
            }
        )

        if stop_due_to_failure:
            break

        if not args.loop:
            break

        if max_cycles > 0 and cycle_index >= max_cycles:
            break

    report_path = write_report(
        cycles=cycle_results,
        mode=resolved_mode,
        selected_wave=args.wave,
        dry_run=args.dry_run,
        continue_on_error=args.continue_on_error,
    )
    print(f"\nReport written to: {report_path.relative_to(REPO_ROOT)}")

    has_failures = any(
        task["status"] == "FAIL"
        for cycle in cycle_results
        for wave in cycle["waves"]
        for task in wave["tasks"]
    )
    return 1 if has_failures else 0


if __name__ == "__main__":
    sys.exit(main())
