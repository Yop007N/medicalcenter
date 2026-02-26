"""Add specialty encounters table for general specialty modules.

Revision ID: c1f4a8b9d2e3
Revises: 9b2f4d6a1c11
Create Date: 2026-02-25 20:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1f4a8b9d2e3'
down_revision: Union[str, None] = '9b2f4d6a1c11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'specialty_encounters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('professional_id', sa.Integer(), nullable=False),
        sa.Column('specialty_key', sa.String(length=64), nullable=False),
        sa.Column('visit_date', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('chief_complaint', sa.Text(), nullable=False),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('assessment', sa.Text(), nullable=True),
        sa.Column('plan', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('vitals', sa.JSON(), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('sync_version', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_index(
        'ix_specialty_encounters_professional_date',
        'specialty_encounters',
        ['professional_id', 'visit_date'],
        unique=False,
    )
    op.create_index(
        'ix_specialty_encounters_specialty_date',
        'specialty_encounters',
        ['specialty_key', 'visit_date'],
        unique=False,
    )
    op.create_index(
        'ix_specialty_encounters_patient_date',
        'specialty_encounters',
        ['patient_id', 'visit_date'],
        unique=False,
    )
    op.create_index(
        op.f('ix_specialty_encounters_patient_id'),
        'specialty_encounters',
        ['patient_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_specialty_encounters_professional_id'),
        'specialty_encounters',
        ['professional_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_specialty_encounters_specialty_key'),
        'specialty_encounters',
        ['specialty_key'],
        unique=False,
    )
    op.create_index(
        op.f('ix_specialty_encounters_visit_date'),
        'specialty_encounters',
        ['visit_date'],
        unique=False,
    )

    op.alter_column('specialty_encounters', 'sync_version', server_default=None)


def downgrade() -> None:
    op.drop_index(op.f('ix_specialty_encounters_visit_date'), table_name='specialty_encounters')
    op.drop_index(op.f('ix_specialty_encounters_specialty_key'), table_name='specialty_encounters')
    op.drop_index(op.f('ix_specialty_encounters_professional_id'), table_name='specialty_encounters')
    op.drop_index(op.f('ix_specialty_encounters_patient_id'), table_name='specialty_encounters')
    op.drop_index('ix_specialty_encounters_patient_date', table_name='specialty_encounters')
    op.drop_index('ix_specialty_encounters_specialty_date', table_name='specialty_encounters')
    op.drop_index('ix_specialty_encounters_professional_date', table_name='specialty_encounters')
    op.drop_table('specialty_encounters')
