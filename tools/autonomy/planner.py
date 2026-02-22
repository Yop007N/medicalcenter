from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .board import MacroTask, MicroTask, count_status, pending_by_lane

LANE_WEIGHTS: dict[str, int] = {
    "security": 5,
    "backend-sync": 5,
    "deploy": 4,
    "frontend": 4,
    "qa": 3,
    "docs-product": 2,
}

# Dependency graph to prevent invalid execution order in pending macros.
DEFAULT_DEPENDENCIES: dict[str, set[str]] = {
    "T046": {"T045"},
    "T047": {"T046"},
    "T048": {"T046"},
    "T051": {"T046"},
    "T052": {"T045"},
    "T053": {"T046", "T047"},
    "T054": {"T046", "T047"},
    "T055": {"T053", "T054"},
    "T067": {"T064"},
    "T069": {"T064"},
    "T070": {"T067"},
    "T095": {"T094"},
    "T096": {"T095"},
    "T099": {"T095"},
    "T100": {"T096", "T099"},
}


@dataclass(frozen=True)
class PrioritizedMacro:
    macro_id: str
    lane: str
    title: str
    score: int
    blocked: bool
    blocked_by: tuple[str, ...]


def _macro_number(macro_id: str) -> int:
    return int(macro_id[1:])


def _score_macro(task: MacroTask, blocked: bool) -> int:
    lane_weight = LANE_WEIGHTS.get(task.lane, 1)
    # Earlier IDs are generally foundational and get a small boost.
    base = (lane_weight * 1000) + (1000 - _macro_number(task.id))
    if blocked:
        base -= 10000
    return base


def prioritize_pending_macros(
    tasks: list[MacroTask],
    dependencies: Mapping[str, set[str]] | None = None,
    top_n: int | None = None,
) -> list[PrioritizedMacro]:
    dep_map = dict(DEFAULT_DEPENDENCIES)
    if dependencies:
        dep_map.update({key: set(value) for key, value in dependencies.items()})

    done_macros = {task.id for task in tasks if task.status == "done"}
    prioritized: list[PrioritizedMacro] = []
    for task in tasks:
        if task.status != "pending":
            continue
        blockers = tuple(sorted(dep for dep in dep_map.get(task.id, set()) if dep not in done_macros))
        blocked = len(blockers) > 0
        prioritized.append(
            PrioritizedMacro(
                macro_id=task.id,
                lane=task.lane,
                title=task.title,
                score=_score_macro(task, blocked=blocked),
                blocked=blocked,
                blocked_by=blockers,
            )
        )

    prioritized.sort(key=lambda item: (-item.score, item.macro_id))
    if top_n is not None:
        return prioritized[:top_n]
    return prioritized


def build_daily_cadence(
    tasks: list[MacroTask],
    daily_slots: int = 12,
) -> dict[str, int]:
    pending_tasks = [task for task in tasks if task.status == "pending"]
    lane_counts = pending_by_lane(pending_tasks)
    if not lane_counts:
        return {}

    weighted_backlog = {
        lane: count * LANE_WEIGHTS.get(lane, 1) for lane, count in lane_counts.items()
    }
    lanes = sorted(weighted_backlog.keys())
    lane_total = len(lanes)

    # If slots are fewer than lanes, pick the most critical lanes first.
    if daily_slots <= lane_total:
        ranked = sorted(
            weighted_backlog.items(), key=lambda row: (-row[1], row[0])
        )[:daily_slots]
        return {lane: 1 for lane, _ in ranked}

    result = {lane: 1 for lane in lanes}
    remaining = daily_slots - lane_total
    total_weight = sum(weighted_backlog.values()) or 1

    raw_extra = {
        lane: (remaining * weighted_backlog[lane]) / total_weight for lane in lanes
    }
    floors = {lane: int(raw_extra[lane]) for lane in lanes}
    for lane, value in floors.items():
        result[lane] += value
    used = sum(floors.values())
    leftovers = remaining - used

    ranked_remainders = sorted(
        lanes,
        key=lambda lane: (raw_extra[lane] - floors[lane], weighted_backlog[lane]),
        reverse=True,
    )
    for lane in ranked_remainders[:leftovers]:
        result[lane] += 1

    return dict(sorted(result.items(), key=lambda row: (-row[1], row[0])))


def build_weekly_kpis(
    macro_tasks: list[MacroTask],
    micro_tasks: list[MicroTask],
) -> dict[str, object]:
    macro_counts = count_status(macro_tasks)
    micro_counts = count_status(micro_tasks)
    macro_total = sum(macro_counts.values()) or 1
    micro_total = sum(micro_counts.values()) or 1

    macro_pending = [task for task in macro_tasks if task.status == "pending"]
    macro_pending_lane = pending_by_lane(macro_pending)
    priorities = prioritize_pending_macros(macro_tasks, top_n=10)

    return {
        "macro_completion_pct": round((macro_counts["done"] / macro_total) * 100, 2),
        "micro_completion_pct": round((micro_counts["done"] / micro_total) * 100, 2),
        "macro_done": macro_counts["done"],
        "macro_pending": macro_counts["pending"],
        "micro_done": micro_counts["done"],
        "micro_pending": micro_counts["pending"],
        "pending_by_lane": macro_pending_lane,
        "top_critical_pending": [
            {
                "macro_id": item.macro_id,
                "lane": item.lane,
                "blocked": item.blocked,
            }
            for item in priorities
        ],
    }

