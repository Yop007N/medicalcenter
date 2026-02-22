from tools.autonomy.board import MacroTask, MicroTask
from tools.autonomy.planner import (
    build_daily_cadence,
    build_weekly_kpis,
    prioritize_pending_macros,
)


def _macro(id_: str, lane: str, status: str) -> MacroTask:
    return MacroTask(id=id_, lane=lane, title=f"title-{id_}", status=status)


def _micro(id_: str, macro: str, lane: str, status: str) -> MicroTask:
    return MicroTask(id=id_, macro=macro, lane=lane, title=f"title-{id_}", status=status)


def test_prioritize_pending_macros_marks_blocked_items() -> None:
    tasks = [
        _macro("T045", "deploy", "pending"),
        _macro("T046", "deploy", "pending"),
        _macro("T073", "security", "pending"),
        _macro("T086", "docs-product", "done"),
    ]

    prioritized = prioritize_pending_macros(tasks)
    as_dict = {item.macro_id: item for item in prioritized}

    assert as_dict["T046"].blocked is True
    assert as_dict["T046"].blocked_by == ("T045",)
    assert as_dict["T073"].blocked is False
    assert as_dict["T073"].score > as_dict["T046"].score


def test_build_daily_cadence_distributes_slots() -> None:
    tasks = [
        _macro("T031", "frontend", "pending"),
        _macro("T032", "frontend", "pending"),
        _macro("T045", "deploy", "pending"),
        _macro("T073", "security", "pending"),
        _macro("T091", "docs-product", "pending"),
    ]
    cadence = build_daily_cadence(tasks, daily_slots=8)

    assert sum(cadence.values()) == 8
    assert cadence["security"] >= cadence["docs-product"]
    assert all(slots >= 1 for slots in cadence.values())


def test_build_weekly_kpis_snapshot() -> None:
    macro_tasks = [
        _macro("T001", "backend-sync", "done"),
        _macro("T002", "backend-sync", "done"),
        _macro("T031", "frontend", "pending"),
        _macro("T045", "deploy", "pending"),
    ]
    micro_tasks = [
        _micro("P0001", "T001", "backend-sync", "done"),
        _micro("P0002", "T001", "backend-sync", "done"),
        _micro("P0003", "T031", "frontend", "pending"),
        _micro("P0004", "T045", "deploy", "pending"),
    ]

    kpis = build_weekly_kpis(macro_tasks, micro_tasks)

    assert kpis["macro_completion_pct"] == 50.0
    assert kpis["micro_completion_pct"] == 50.0
    assert kpis["pending_by_lane"] == {"deploy": 1, "frontend": 1}

