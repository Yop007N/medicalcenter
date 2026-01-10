"""add_clinical_history_models

Revision ID: b7c3d9e1f2a4
Revises: a54169af0a5a
Create Date: 2025-12-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c3d9e1f2a4'
down_revision: Union[str, None] = 'a54169af0a5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create evolutions table
    op.create_table(
        'evolutions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('professional_id', sa.Integer(), nullable=False),
        sa.Column('treatment_plan_id', sa.Integer(), nullable=True),
        sa.Column('action_performed', sa.Text(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, default='pending'),
        sa.Column('professional_signature', sa.Text(), nullable=True),
        sa.Column('professional_signed_at', sa.DateTime(), nullable=True),
        sa.Column('patient_signature', sa.Text(), nullable=True),
        sa.Column('patient_signed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.ForeignKeyConstraint(['treatment_plan_id'], ['dental_treatments.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_evolutions_patient', 'evolutions', ['patient_id'])
    op.create_index('idx_evolutions_professional', 'evolutions', ['professional_id'])

    # Create anamnesis table
    op.create_table(
        'anamnesis',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False, unique=True),
        sa.Column('professional_id', sa.Integer(), nullable=True),
        sa.Column('consultation_reason', sa.String(length=200), nullable=True),
        sa.Column('medical_alerts', sa.JSON(), nullable=True),
        sa.Column('current_medications', sa.JSON(), nullable=True),
        sa.Column('habits', sa.JSON(), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('other_conditions', sa.Text(), nullable=True),
        sa.Column('is_pregnant', sa.Boolean(), nullable=True, default=False),
        sa.Column('pregnancy_weeks', sa.Integer(), nullable=True),
        sa.Column('last_dental_visit', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_anamnesis_patient', 'anamnesis', ['patient_id'])

    # Create periodontal_records table
    op.create_table(
        'periodontal_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('professional_id', sa.Integer(), nullable=False),
        sa.Column('odontogram_id', sa.Integer(), nullable=True),
        sa.Column('measurement_date', sa.Date(), nullable=False),
        sa.Column('tooth_number', sa.Integer(), nullable=False),
        sa.Column('probing_depth_mb', sa.Integer(), nullable=True),
        sa.Column('probing_depth_b', sa.Integer(), nullable=True),
        sa.Column('probing_depth_db', sa.Integer(), nullable=True),
        sa.Column('probing_depth_ml', sa.Integer(), nullable=True),
        sa.Column('probing_depth_l', sa.Integer(), nullable=True),
        sa.Column('probing_depth_dl', sa.Integer(), nullable=True),
        sa.Column('margin_mb', sa.Integer(), nullable=True),
        sa.Column('margin_b', sa.Integer(), nullable=True),
        sa.Column('margin_db', sa.Integer(), nullable=True),
        sa.Column('margin_ml', sa.Integer(), nullable=True),
        sa.Column('margin_l', sa.Integer(), nullable=True),
        sa.Column('margin_dl', sa.Integer(), nullable=True),
        sa.Column('furcation', sa.String(length=10), nullable=True),
        sa.Column('mobility', sa.Integer(), nullable=True),
        sa.Column('bleeding', sa.Boolean(), nullable=True, default=False),
        sa.Column('plaque', sa.Boolean(), nullable=True, default=False),
        sa.Column('suppuration', sa.Boolean(), nullable=True, default=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.ForeignKeyConstraint(['odontogram_id'], ['odontograms.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_id', 'measurement_date', 'tooth_number', name='unique_periodontal_per_tooth_date')
    )
    op.create_index('idx_periodontal_patient', 'periodontal_records', ['patient_id'])
    op.create_index('idx_periodontal_tooth', 'periodontal_records', ['tooth_number'])

    # Create patient_documents table
    op.create_table(
        'patient_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('professional_id', sa.Integer(), nullable=True),
        sa.Column('file_id', sa.Integer(), nullable=True),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('affected_teeth', sa.JSON(), nullable=True),
        sa.Column('document_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.ForeignKeyConstraint(['file_id'], ['files.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_patient_documents_patient', 'patient_documents', ['patient_id'])
    op.create_index('idx_patient_documents_type', 'patient_documents', ['document_type'])

    # Create prescriptions table
    op.create_table(
        'prescriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('professional_id', sa.Integer(), nullable=False),
        sa.Column('treatment_id', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('prescription_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, default='active'),
        sa.Column('professional_signature', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.ForeignKeyConstraint(['treatment_id'], ['dental_treatments.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_prescriptions_patient', 'prescriptions', ['patient_id'])
    op.create_index('idx_prescriptions_professional', 'prescriptions', ['professional_id'])

    # Create clinical_documents table
    op.create_table(
        'clinical_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('professional_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('template_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_clinical_documents_patient', 'clinical_documents', ['patient_id'])
    op.create_index('idx_clinical_documents_type', 'clinical_documents', ['document_type'])

    # Create informed_consents table
    op.create_table(
        'informed_consents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('professional_id', sa.Integer(), nullable=False),
        sa.Column('treatment_id', sa.Integer(), nullable=True),
        sa.Column('consent_type', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, default='pending'),
        sa.Column('patient_signature', sa.Text(), nullable=True),
        sa.Column('patient_signed_at', sa.DateTime(), nullable=True),
        sa.Column('guardian_name', sa.String(length=200), nullable=True),
        sa.Column('guardian_relationship', sa.String(length=100), nullable=True),
        sa.Column('guardian_signature', sa.Text(), nullable=True),
        sa.Column('guardian_signed_at', sa.DateTime(), nullable=True),
        sa.Column('witness_professional_id', sa.Integer(), nullable=True),
        sa.Column('rejected_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.ForeignKeyConstraint(['treatment_id'], ['dental_treatments.id']),
        sa.ForeignKeyConstraint(['witness_professional_id'], ['professionals.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_informed_consents_patient', 'informed_consents', ['patient_id'])
    op.create_index('idx_informed_consents_status', 'informed_consents', ['status'])

    # Create clinical_history_events table
    op.create_table(
        'clinical_history_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('professional_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('reference_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_date', sa.DateTime(), nullable=True),
        sa.Column('is_important', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_clinical_events_patient', 'clinical_history_events', ['patient_id'])
    op.create_index('idx_clinical_events_type', 'clinical_history_events', ['event_type'])
    op.create_index('idx_clinical_events_date', 'clinical_history_events', ['event_date'])


def downgrade() -> None:
    # Drop indexes and tables in reverse order
    op.drop_index('idx_clinical_events_date', table_name='clinical_history_events')
    op.drop_index('idx_clinical_events_type', table_name='clinical_history_events')
    op.drop_index('idx_clinical_events_patient', table_name='clinical_history_events')
    op.drop_table('clinical_history_events')

    op.drop_index('idx_informed_consents_status', table_name='informed_consents')
    op.drop_index('idx_informed_consents_patient', table_name='informed_consents')
    op.drop_table('informed_consents')

    op.drop_index('idx_clinical_documents_type', table_name='clinical_documents')
    op.drop_index('idx_clinical_documents_patient', table_name='clinical_documents')
    op.drop_table('clinical_documents')

    op.drop_index('idx_prescriptions_professional', table_name='prescriptions')
    op.drop_index('idx_prescriptions_patient', table_name='prescriptions')
    op.drop_table('prescriptions')

    op.drop_index('idx_patient_documents_type', table_name='patient_documents')
    op.drop_index('idx_patient_documents_patient', table_name='patient_documents')
    op.drop_table('patient_documents')

    op.drop_index('idx_periodontal_tooth', table_name='periodontal_records')
    op.drop_index('idx_periodontal_patient', table_name='periodontal_records')
    op.drop_table('periodontal_records')

    op.drop_index('idx_anamnesis_patient', table_name='anamnesis')
    op.drop_table('anamnesis')

    op.drop_index('idx_evolutions_professional', table_name='evolutions')
    op.drop_index('idx_evolutions_patient', table_name='evolutions')
    op.drop_table('evolutions')
