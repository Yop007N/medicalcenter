# -*- coding: utf-8 -*-
"""
Bootstrap database state for Docker development startup.
"""

from __future__ import annotations

import subprocess

from sqlalchemy import inspect

from app import create_app
from app.extensions import db


def run_command(*args: str) -> None:
    print(f"[bootstrap_db] Running: {' '.join(args)}")
    subprocess.run(list(args), check=True)


def main() -> int:
    app = create_app("development")

    with app.app_context():
        inspector = inspect(db.engine)
        has_alembic_table = inspector.has_table("alembic_version")
        table_count = len(inspector.get_table_names())

    print(
        "[bootstrap_db] State: "
        f"tables={table_count}, has_alembic_version={has_alembic_table}"
    )

    if has_alembic_table:
        run_command("flask", "db", "upgrade")
        return 0

    if table_count == 0:
        print("[bootstrap_db] Empty schema detected. Running init_db.py...")
        run_command("python", "init_db.py")

    print("[bootstrap_db] Stamping Alembic to current head...")
    run_command("alembic", "stamp", "head")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        print(f"[bootstrap_db] Command failed with exit code {exc.returncode}")
        raise SystemExit(exc.returncode) from exc
    except Exception as exc:  # pragma: no cover - startup guard
        print(f"[bootstrap_db] Unexpected error: {exc}")
        raise SystemExit(1) from exc
