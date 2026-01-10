"""Add file fields to patient_documents

Revision ID: 63f140c09d89
Revises: b7c3d9e1f2a4
Create Date: 2025-12-05 11:22:30.547916

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '63f140c09d89'
down_revision: Union[str, None] = 'b7c3d9e1f2a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add file storage columns to patient_documents
    op.add_column('patient_documents', sa.Column('file_name', sa.String(length=255), nullable=True))
    op.add_column('patient_documents', sa.Column('file_path', sa.String(length=500), nullable=True))
    op.add_column('patient_documents', sa.Column('mime_type', sa.String(length=100), nullable=True))
    op.add_column('patient_documents', sa.Column('file_size', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('patient_documents', 'file_size')
    op.drop_column('patient_documents', 'mime_type')
    op.drop_column('patient_documents', 'file_path')
    op.drop_column('patient_documents', 'file_name')
