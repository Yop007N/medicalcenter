"""Add composite index on specialty_encounters and fix sync_log entity_id type.

- Adds (patient_id, specialty_key, visit_date) index on specialty_encounters
  for the most common patient history query pattern.
- Changes sync_log.entity_id from Integer to String(128) to safely handle
  client-side 'local-{id}' references without collision on id=0.

Revision ID: a1b2c3d4e5f6
Revises: e6b9c4d8a2f7
Create Date: 2026-03-09
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'a1b2c3d4e5f6'
down_revision = 'e6b9c4d8a2f7'
branch_labels = None
depends_on = None


def upgrade():
    # --- specialty_encounters: composite index for patient history queries ---
    op.create_index(
        'ix_specialty_encounters_patient_specialty_date',
        'specialty_encounters',
        ['patient_id', 'specialty_key', 'visit_date'],
        unique=False,
    )

    # --- sync_logs: change entity_id from Integer to String(128) ---
    op.alter_column(
        'sync_logs',
        'entity_id',
        existing_type=sa.Integer(),
        type_=sa.String(length=128),
        postgresql_using='entity_id::text',
        existing_nullable=False,
    )


def downgrade():
    op.alter_column(
        'sync_logs',
        'entity_id',
        existing_type=sa.String(length=128),
        type_=sa.Integer(),
        postgresql_using='entity_id::integer',
        existing_nullable=False,
    )

    op.drop_index(
        'ix_specialty_encounters_patient_specialty_date',
        table_name='specialty_encounters',
    )
