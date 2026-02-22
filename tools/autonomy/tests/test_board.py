from pathlib import Path

from tools.autonomy.board import (
    count_status,
    load_macro_board,
    load_micro_board,
    update_boards_for_macros,
)


MACRO_FIXTURE = """# Tablero

Estado agregado actual: `1 done`, `0 in_progress`, `2 pending`

| ID | Carril | Tarea | Estado |
| --- | --- | --- | --- |
| T001 | backend-sync | Task one | done |
| T002 | qa | Task two | pending |
| T003 | docs-product | Task three | pending |
"""

MICRO_FIXTURE = """# Tablero Micro

Estado agregado actual: `10 done`, `0 in_progress`, `20 pending`

| ID | Macro | Carril | Microtarea | Estado |
| --- | --- | --- | --- | --- |
| P0001 | T001 | backend-sync | Task one a | done |
| P0002 | T001 | backend-sync | Task one b | done |
| P0003 | T002 | qa | Task two a | pending |
| P0004 | T002 | qa | Task two b | pending |
| P0005 | T003 | docs-product | Task three a | pending |
| P0006 | T003 | docs-product | Task three b | pending |
"""


def _write(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def test_load_boards_and_counts(tmp_path: Path) -> None:
    macro_path = tmp_path / "board100.md"
    micro_path = tmp_path / "board1000.md"
    _write(macro_path, MACRO_FIXTURE)
    _write(micro_path, MICRO_FIXTURE)

    macro_tasks = load_macro_board(macro_path)
    micro_tasks = load_micro_board(micro_path)

    assert len(macro_tasks) == 3
    assert len(micro_tasks) == 6
    assert count_status(macro_tasks) == {"done": 1, "in_progress": 0, "pending": 2}
    assert count_status(micro_tasks) == {"done": 2, "in_progress": 0, "pending": 4}


def test_update_boards_for_macros(tmp_path: Path) -> None:
    macro_path = tmp_path / "board100.md"
    micro_path = tmp_path / "board1000.md"
    _write(macro_path, MACRO_FIXTURE)
    _write(micro_path, MICRO_FIXTURE)

    summary = update_boards_for_macros(
        board_100_path=macro_path,
        board_1000_path=micro_path,
        macro_ids={"T002"},
        new_status="done",
    )

    assert summary["macro_rows_updated"] == 1
    assert summary["micro_rows_updated"] == 2
    assert summary["macro_done"] == 2
    assert summary["macro_pending"] == 1
    assert summary["micro_done"] == 4
    assert summary["micro_pending"] == 2

    updated_macro = macro_path.read_text(encoding="utf-8")
    updated_micro = micro_path.read_text(encoding="utf-8")
    assert "| T002 | qa | Task two | done |" in updated_macro
    assert "Estado agregado actual: `2 done`, `0 in_progress`, `1 pending`" in updated_macro
    assert "| P0003 | T002 | qa | Task two a | done |" in updated_micro
    assert "Estado agregado actual: `4 done`, `0 in_progress`, `2 pending`" in updated_micro

