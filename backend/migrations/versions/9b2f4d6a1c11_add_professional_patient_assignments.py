# -*- coding: utf-8 -*-
"""Add explicit professional-patient assignments.

Revision ID: 9b2f4d6a1c11
Revises: 4c1e2a9b7f01
Create Date: 2026-02-25 20:05:00.000000
"""

from datetime import datetime
from typing import Set, Tuple, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b2f4d6a1c11'
down_revision: Union[str, None] = '4c1e2a9b7f01'
branch_labels = None
depends_on = None


def _collect_pairs(bind) -> Set[Tuple[int, int]]:
    """Collect distinct professional/patient pairs from existing clinical activity."""
    pair_queries = [
        sa.text(
            """
            SELECT DISTINCT professional_id, patient_id
            FROM appointments
            WHERE professional_id IS NOT NULL AND patient_id IS NOT NULL
            """
        ),
        sa.text(
            """
            SELECT DISTINCT professional_id, patient_id
            FROM medical_records
            WHERE professional_id IS NOT NULL AND patient_id IS NOT NULL
            """
        ),
        sa.text(
            """
            SELECT DISTINCT b.created_by AS professional_id, b.patient_id
            FROM budgets b
            INNER JOIN professionals p ON p.id = b.created_by
            WHERE b.created_by IS NOT NULL AND b.patient_id IS NOT NULL
            """
        ),
        sa.text(
            """
            SELECT DISTINCT professional_id, patient_id
            FROM odontograms
            WHERE professional_id IS NOT NULL AND patient_id IS NOT NULL
            """
        ),
        sa.text(
            """
            SELECT DISTINCT professional_id, patient_id
            FROM dental_treatments
            WHERE professional_id IS NOT NULL AND patient_id IS NOT NULL
            """
        ),
        sa.text(
            """
            SELECT DISTINCT professional_id, patient_id
            FROM psychological_evaluations
            WHERE professional_id IS NOT NULL AND patient_id IS NOT NULL
            """
        ),
        sa.text(
            """
            SELECT DISTINCT professional_id, patient_id
            FROM psychopedagogical_evaluations
            WHERE professional_id IS NOT NULL AND patient_id IS NOT NULL
            """
        ),
    ]

    pairs: Set[Tuple[int, int]] = set()
    for query in pair_queries:
        rows = bind.execute(query).fetchall()
        for row in rows:
            professional_id = int(row[0])
            patient_id = int(row[1])
            pairs.add((professional_id, patient_id))
    return pairs


def upgrade() -> None:
    op.create_table(
        'professional_patient_assignments',
        sa.Column('professional_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('assigned_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('professional_id', 'patient_id'),
    )
    op.create_index(
        'ix_professional_patient_assignments_patient_id',
        'professional_patient_assignments',
        ['patient_id'],
        unique=False,
    )

    bind = op.get_bind()
    pairs = _collect_pairs(bind)
    if not pairs:
        return

    assignments_table = sa.table(
        'professional_patient_assignments',
        sa.column('professional_id', sa.Integer),
        sa.column('patient_id', sa.Integer),
        sa.column('assigned_at', sa.DateTime),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime),
    )

    now = datetime.utcnow()
    op.bulk_insert(
        assignments_table,
        [
            {
                'professional_id': professional_id,
                'patient_id': patient_id,
                'assigned_at': now,
                'created_at': now,
                'updated_at': now,
            }
            for professional_id, patient_id in sorted(pairs)
        ],
    )


def downgrade() -> None:
    op.drop_index(
        'ix_professional_patient_assignments_patient_id',
        table_name='professional_patient_assignments',
    )
    op.drop_table('professional_patient_assignments')
