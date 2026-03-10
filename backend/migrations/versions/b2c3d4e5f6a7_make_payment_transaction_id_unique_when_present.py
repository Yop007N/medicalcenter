"""Make payment transaction_id unique only when present.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-09
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'payments',
        'transaction_id',
        existing_type=sa.String(length=100),
        nullable=True,
    )

    op.execute('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_transaction_id_key')
    op.execute('DROP INDEX IF EXISTS uq_payments_transaction_id')
    op.create_index(
        'uq_payments_transaction_id',
        'payments',
        ['transaction_id'],
        unique=True,
        postgresql_where=sa.text('transaction_id IS NOT NULL'),
    )


def downgrade():
    op.drop_index('uq_payments_transaction_id', table_name='payments')
    op.create_unique_constraint(
        'payments_transaction_id_key',
        'payments',
        ['transaction_id'],
    )
