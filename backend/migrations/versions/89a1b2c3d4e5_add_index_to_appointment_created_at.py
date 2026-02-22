"""add_index_to_appointment_created_at

Revision ID: 89a1b2c3d4e5
Revises: 63f140c09d89
Create Date: 2026-02-22 23:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89a1b2c3d4e5'
down_revision: Union[str, None] = '63f140c09d89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('idx_appointments_created_at', 'appointments', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_appointments_created_at', table_name='appointments')
