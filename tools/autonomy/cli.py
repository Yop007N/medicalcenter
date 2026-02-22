from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys

from .board import (
    count_status,
    load_macro_board,
    load_micro_board,
    pending_by_lane,
    update_boards_for_macros,
)
from .planner import build_daily_cadence, build_weekly_kpis, prioritize_pending_macros
from .qa_report import build_default_suites, render_markdown as render_qa_markdown, run_suites


DEFAULT_BOARD_100 = Path("docs/roadmap/TABLERO_100_TAREAS_AUTONOMO.md")
DEFAULT_BOARD_1000 = Path("docs/roadmap/TABLERO_1000_TAREAS_AUTONOMO.md")
DEFAULT_REPORTS_DIR = Path("docs/roadmap/reports")
DEFAULT_SNAPSHOT_JSON = DEFAULT_REPORTS_DIR / "AUTONOMY_SNAPSHOT.json"
DEFAULT_SNAPSHOT_MD = DEFAULT_REPORTS_DIR / "AUTONOMY_DAILY_OPERATIONS.md"
DEFAULT_QA_MD = DEFAULT_REPORTS_DIR / "QA_DAILY_TEST_STATUS.md"


def _ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def build_snapshot_payload(
    macro_tasks,
    micro_tasks,
    *,
    top_n: int,
) -> dict[str, object]:
    macro_counts = count_status(macro_tasks)
    micro_counts = count_status(micro_tasks)
    priorities = prioritize_pending_macros(macro_tasks, top_n=top_n)
    cadence = build_daily_cadence(macro_tasks, daily_slots=12)
    kpis = build_weekly_kpis(macro_tasks, micro_tasks)

    compact_context = [
        {
            "macro_id": item.macro_id,
            "lane": item.lane,
            "task": item.title,
            "blocked": item.blocked,
            "blocked_by": list(item.blocked_by),
        }
        for item in priorities
    ]

    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "macro_counts": macro_counts,
        "micro_counts": micro_counts,
        "pending_macro_by_lane": pending_by_lane(
            [task for task in macro_tasks if task.status == "pending"]
        ),
        "daily_cadence_slots": cadence,
        "priority_rules": {
            "lane_weights": {
                "security": 5,
                "backend-sync": 5,
                "deploy": 4,
                "frontend": 4,
                "qa": 3,
                "docs-product": 2,
            },
            "notes": [
                "Prioritize security/backend-sync/deploy before docs-product.",
                "Any macro with unmet dependencies is marked blocked.",
                "Prefer low-ID pending tasks inside same lane for deterministic flow.",
            ],
        },
        "top_prioritized_macros": compact_context,
        "blocked_macros": [item for item in compact_context if item["blocked"]],
        "weekly_kpis": kpis,
    }


def render_snapshot_markdown(payload: dict[str, object]) -> str:
    lines = [
        "# Operacion Autonoma Diaria",
        "",
        f"Generated (UTC): {payload['generated_at_utc']}",
        "",
        "## Cadencia Diaria Por Carriles",
    ]

    cadence = payload["daily_cadence_slots"]
    if cadence:
        for lane, slots in cadence.items():
            lines.append(f"- `{lane}`: `{slots}` slots diarios")
    else:
        lines.append("- Sin tareas pendientes.")

    lines.extend(
        [
            "",
            "## Criterio De Priorizacion",
        ]
    )
    for note in payload["priority_rules"]["notes"]:
        lines.append(f"- {note}")

    lines.extend(
        [
            "",
            "## Bloqueo Y Escalamiento",
        ]
    )
    blocked = payload["blocked_macros"]
    if blocked:
        for item in blocked:
            blockers = ", ".join(item["blocked_by"]) or "unknown"
            lines.append(
                f"- `{item['macro_id']}` bloqueado por `{blockers}`. Escalar si persiste >24h."
            )
    else:
        lines.append("- No hay macros bloqueados por dependencias.")

    kpis = payload["weekly_kpis"]
    lines.extend(
        [
            "",
            "## KPI Semanales",
            f"- Macro avance: `{kpis['macro_completion_pct']}%` ({kpis['macro_done']} done / {kpis['macro_pending']} pending).",
            f"- Micro avance: `{kpis['micro_completion_pct']}%` ({kpis['micro_done']} done / {kpis['micro_pending']} pending).",
            "",
            "## Contexto Compacto Para Codex",
            "Usar esta lista para evitar releer el tablero completo en cada iteracion:",
        ]
    )
    for item in payload["top_prioritized_macros"]:
        blocked_suffix = " [BLOCKED]" if item["blocked"] else ""
        lines.append(
            f"- `{item['macro_id']}` `{item['lane']}`: {item['task']}{blocked_suffix}"
        )

    return "\n".join(lines) + "\n"


def command_snapshot(args: argparse.Namespace) -> int:
    macro_tasks = load_macro_board(Path(args.board100))
    micro_tasks = load_micro_board(Path(args.board1000))
    payload = build_snapshot_payload(macro_tasks, micro_tasks, top_n=args.top)

    json_path = Path(args.output_json)
    md_path = Path(args.output_md)
    _ensure_parent(json_path)
    _ensure_parent(md_path)
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    md_path.write_text(render_snapshot_markdown(payload), encoding="utf-8")
    print(f"Snapshot written to {json_path}")
    print(f"Operations markdown written to {md_path}")
    return 0


def command_qa_report(args: argparse.Namespace) -> int:
    suites = build_default_suites(args.python_executable)
    results = run_suites(
        suites=suites,
        cwd=Path(args.cwd),
        run_tests=args.run_tests,
        timeout_seconds=args.timeout_seconds,
    )
    content = render_qa_markdown(results)
    output_path = Path(args.output_md)
    _ensure_parent(output_path)
    output_path.write_text(content, encoding="utf-8")
    print(f"QA report written to {output_path}")
    return 0


def command_close_macros(args: argparse.Namespace) -> int:
    summary = update_boards_for_macros(
        board_100_path=Path(args.board100),
        board_1000_path=Path(args.board1000),
        macro_ids=set(args.macros),
        new_status=args.status,
    )
    print(json.dumps(summary, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="autonomy-cli",
        description="Roadmap autonomy utilities (planning, QA report, board updates).",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    snapshot = subparsers.add_parser(
        "snapshot", help="Generate compact roadmap snapshot for token-efficient runs."
    )
    snapshot.add_argument("--board100", default=str(DEFAULT_BOARD_100))
    snapshot.add_argument("--board1000", default=str(DEFAULT_BOARD_1000))
    snapshot.add_argument("--output-json", default=str(DEFAULT_SNAPSHOT_JSON))
    snapshot.add_argument("--output-md", default=str(DEFAULT_SNAPSHOT_MD))
    snapshot.add_argument("--top", type=int, default=12)
    snapshot.set_defaults(handler=command_snapshot)

    qa_report = subparsers.add_parser(
        "qa-report", help="Generate daily QA report and optionally execute test suites."
    )
    qa_report.add_argument("--output-md", default=str(DEFAULT_QA_MD))
    qa_report.add_argument("--cwd", default=".")
    qa_report.add_argument("--python-executable", default=sys.executable)
    qa_report.add_argument("--timeout-seconds", type=int, default=1200)
    qa_report.add_argument("--run-tests", action="store_true")
    qa_report.set_defaults(handler=command_qa_report)

    close_macros = subparsers.add_parser(
        "close-macros", help="Mark macro tasks and their microtasks with a target status."
    )
    close_macros.add_argument("--board100", default=str(DEFAULT_BOARD_100))
    close_macros.add_argument("--board1000", default=str(DEFAULT_BOARD_1000))
    close_macros.add_argument(
        "--macros",
        nargs="+",
        required=True,
        help="Macro IDs, e.g. T068 T091 T092",
    )
    close_macros.add_argument(
        "--status",
        default="done",
        choices=["done", "in_progress", "pending"],
    )
    close_macros.set_defaults(handler=command_close_macros)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.handler(args)


if __name__ == "__main__":
    raise SystemExit(main())

