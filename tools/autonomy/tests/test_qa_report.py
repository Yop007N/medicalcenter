from datetime import datetime, timezone

from tools.autonomy.qa_report import (
    QaResult,
    build_default_suites,
    extract_summary_line,
    render_markdown,
)


def test_extract_summary_line_prefers_pytest_summary() -> None:
    output = """
    random log
    something else
    17 passed, 1 warning in 2.34s
    """
    assert extract_summary_line(output) == "17 passed, 1 warning in 2.34s"


def test_build_default_suites_uses_custom_python_executable() -> None:
    suites = build_default_suites("C:/python/python.exe")
    assert suites
    for suite in suites:
        assert suite.command[0] == "C:/python/python.exe"


def test_render_markdown_includes_summary_counts() -> None:
    results = [
        QaResult(
            name="suite1",
            description="desc",
            command="pytest suite1",
            status="PASS",
            summary="10 passed in 1.0s",
            duration_seconds=1.0,
        ),
        QaResult(
            name="suite2",
            description="desc",
            command="pytest suite2",
            status="FAIL",
            summary="1 failed in 2.0s",
            duration_seconds=2.0,
        ),
    ]
    markdown = render_markdown(
        results,
        generated_at=datetime(2026, 2, 14, 0, 0, tzinfo=timezone.utc),
    )
    assert "Summary: `1 PASS`, `1 FAIL`, `0 SKIP`, `3.0s total`" in markdown
    assert "| suite1 | PASS | 1.0 | 10 passed in 1.0s |" in markdown
    assert "| suite2 | FAIL | 2.0 | 1 failed in 2.0s |" in markdown
