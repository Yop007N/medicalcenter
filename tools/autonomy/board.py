from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
import re
from typing import Iterable

STATUS_VALUES = {"done", "in_progress", "pending"}

MACRO_ROW_RE = re.compile(
    r"^\| (?P<id>T\d{3}) \| (?P<lane>[^|]+) \| (?P<title>[^|]+) \| (?P<status>done|in_progress|pending) \|$"
)
MICRO_ROW_RE = re.compile(
    r"^\| (?P<id>P\d{4}) \| (?P<macro>T\d{3}) \| (?P<lane>[^|]+) \| (?P<title>[^|]+) \| (?P<status>done|in_progress|pending) \|$"
)
AGGREGATE_RE = re.compile(
    r"Estado agregado actual: `\d+ done`, `\d+ in_progress`, `\d+ pending`"
)


@dataclass(frozen=True)
class MacroTask:
    id: str
    lane: str
    title: str
    status: str


@dataclass(frozen=True)
class MicroTask:
    id: str
    macro: str
    lane: str
    title: str
    status: str


def load_macro_board(path: Path) -> list[MacroTask]:
    tasks: list[MacroTask] = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        match = MACRO_ROW_RE.match(line)
        if not match:
            continue
        tasks.append(
            MacroTask(
                id=match.group("id"),
                lane=match.group("lane").strip(),
                title=match.group("title").strip(),
                status=match.group("status").strip(),
            )
        )
    return tasks


def load_micro_board(path: Path) -> list[MicroTask]:
    tasks: list[MicroTask] = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        match = MICRO_ROW_RE.match(line)
        if not match:
            continue
        tasks.append(
            MicroTask(
                id=match.group("id"),
                macro=match.group("macro").strip(),
                lane=match.group("lane").strip(),
                title=match.group("title").strip(),
                status=match.group("status").strip(),
            )
        )
    return tasks


def count_status(items: Iterable[MacroTask | MicroTask]) -> dict[str, int]:
    counts = {status: 0 for status in STATUS_VALUES}
    for item in items:
        if item.status not in STATUS_VALUES:
            raise ValueError(f"Invalid status: {item.status}")
        counts[item.status] += 1
    return counts


def pending_by_lane(items: Iterable[MacroTask | MicroTask]) -> dict[str, int]:
    lane_counts: dict[str, int] = {}
    for item in items:
        if item.status != "pending":
            continue
        lane_counts[item.lane] = lane_counts.get(item.lane, 0) + 1
    return dict(sorted(lane_counts.items(), key=lambda row: row[0]))


def _replace_status_in_rows(
    lines: list[str],
    row_re: re.Pattern[str],
    should_update: Callable[[re.Match[str]], bool],
    new_status: str,
) -> int:
    updated = 0
    for index, raw_line in enumerate(lines):
        line = raw_line.strip()
        match = row_re.match(line)
        if not match:
            continue
        if not should_update(match):
            continue
        if match.group("status").strip() == new_status:
            continue

        fields = [part.strip() for part in line.strip("|").split("|")]
        fields[-1] = new_status
        lines[index] = "| " + " | ".join(fields) + " |"
        updated += 1
    return updated


def update_macro_statuses(path: Path, macro_ids: set[str], new_status: str) -> int:
    if new_status not in STATUS_VALUES:
        raise ValueError(f"Unsupported status: {new_status}")
    lines = path.read_text(encoding="utf-8").splitlines()
    updated = _replace_status_in_rows(
        lines=lines,
        row_re=MACRO_ROW_RE,
        should_update=lambda match: match.group("id") in macro_ids,
        new_status=new_status,
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return updated


def update_micro_statuses_by_macro(
    path: Path,
    macro_ids: set[str],
    new_status: str,
) -> int:
    if new_status not in STATUS_VALUES:
        raise ValueError(f"Unsupported status: {new_status}")
    lines = path.read_text(encoding="utf-8").splitlines()
    updated = _replace_status_in_rows(
        lines=lines,
        row_re=MICRO_ROW_RE,
        should_update=lambda match: match.group("macro") in macro_ids,
        new_status=new_status,
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return updated


def update_aggregate_line(path: Path, counts: dict[str, int]) -> None:
    replacement = (
        f"Estado agregado actual: `{counts['done']} done`, "
        f"`{counts['in_progress']} in_progress`, "
        f"`{counts['pending']} pending`"
    )
    lines = path.read_text(encoding="utf-8").splitlines()
    changed = False
    for index, line in enumerate(lines):
        if AGGREGATE_RE.search(line):
            lines[index] = AGGREGATE_RE.sub(replacement, line)
            changed = True
            break
    if not changed:
        raise ValueError(f"Aggregate line not found in {path}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def update_boards_for_macros(
    board_100_path: Path,
    board_1000_path: Path,
    macro_ids: set[str],
    new_status: str = "done",
) -> dict[str, int]:
    macro_rows_updated = update_macro_statuses(board_100_path, macro_ids, new_status)
    micro_rows_updated = update_micro_statuses_by_macro(
        board_1000_path, macro_ids, new_status
    )

    macro_counts = count_status(load_macro_board(board_100_path))
    micro_counts = count_status(load_micro_board(board_1000_path))
    update_aggregate_line(board_100_path, macro_counts)
    update_aggregate_line(board_1000_path, micro_counts)

    return {
        "macro_rows_updated": macro_rows_updated,
        "micro_rows_updated": micro_rows_updated,
        "macro_done": macro_counts["done"],
        "macro_in_progress": macro_counts["in_progress"],
        "macro_pending": macro_counts["pending"],
        "micro_done": micro_counts["done"],
        "micro_in_progress": micro_counts["in_progress"],
        "micro_pending": micro_counts["pending"],
    }
