"""Add sync versioning and multi-node idempotency hardening

Revision ID: f0e1d2c3b4a5
Revises: 63f140c09d89
Create Date: 2026-02-24 22:37:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f0e1d2c3b4a5"
down_revision: Union[str, None] = "63f140c09d89"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _deduplicate_sync_logs_idempotency_keys() -> None:
    bind = op.get_bind()
    sync_logs = sa.table(
        "sync_logs",
        sa.column("id", sa.Integer),
        sa.column("idempotency_key", sa.String),
        sa.column("direction", sa.String),
    )

    duplicate_keys = bind.execute(
        sa.select(
            sync_logs.c.idempotency_key,
            sync_logs.c.direction,
            sa.func.count(sync_logs.c.id).label("total"),
        )
        .where(sync_logs.c.idempotency_key.isnot(None))
        .group_by(sync_logs.c.idempotency_key, sync_logs.c.direction)
        .having(sa.func.count(sync_logs.c.id) > 1)
    ).all()

    for idempotency_key, direction, _total in duplicate_keys:
        rows = bind.execute(
            sa.select(sync_logs.c.id)
            .where(
                sa.and_(
                    sync_logs.c.idempotency_key == idempotency_key,
                    sync_logs.c.direction == direction,
                )
            )
            .order_by(sync_logs.c.id.desc())
        ).all()

        ids_to_delete = [row[0] for row in rows[1:]]
        if not ids_to_delete:
            continue

        bind.execute(
            sa.delete(sync_logs).where(sync_logs.c.id.in_(ids_to_delete))
        )


def upgrade() -> None:
    op.add_column(
        "appointments",
        sa.Column("sync_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "medical_records",
        sa.Column("sync_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "budgets",
        sa.Column("sync_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "payments",
        sa.Column("sync_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "files",
        sa.Column("sync_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column("sync_logs", sa.Column("result_entity_version", sa.Integer(), nullable=True))

    _deduplicate_sync_logs_idempotency_keys()

    op.create_index(
        "ux_sync_logs_idempotency_direction",
        "sync_logs",
        ["idempotency_key", "direction"],
        unique=True,
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
        sqlite_where=sa.text("idempotency_key IS NOT NULL"),
    )

    op.alter_column("appointments", "sync_version", server_default=None)
    op.alter_column("medical_records", "sync_version", server_default=None)
    op.alter_column("budgets", "sync_version", server_default=None)
    op.alter_column("payments", "sync_version", server_default=None)
    op.alter_column("files", "sync_version", server_default=None)


def downgrade() -> None:
    op.drop_index("ux_sync_logs_idempotency_direction", table_name="sync_logs")

    op.drop_column("sync_logs", "result_entity_version")
    op.drop_column("files", "sync_version")
    op.drop_column("payments", "sync_version")
    op.drop_column("budgets", "sync_version")
    op.drop_column("medical_records", "sync_version")
    op.drop_column("appointments", "sync_version")
