"""add_audit_logs_table

Revision ID: a54169af0a5a
Revises: 32d0cbdbea99
Create Date: 2025-11-22 12:34:09.846084

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a54169af0a5a'
down_revision: Union[str, None] = '32d0cbdbea99'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('user_email', sa.String(length=255), nullable=True),
        sa.Column('user_role', sa.String(length=50), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('changes', sa.JSON(), nullable=True),
        sa.Column('extra_data', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('request_method', sa.String(length=10), nullable=True),
        sa.Column('request_path', sa.String(length=500), nullable=True),
        sa.Column('request_query', sa.Text(), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('sensitive_data_access', sa.Boolean(), nullable=True),
        sa.Column('export_action', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_audit_user_timestamp', 'audit_logs', ['user_id', 'timestamp'])
    op.create_index('idx_audit_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_action_timestamp', 'audit_logs', ['action', 'timestamp'])
    op.create_index('idx_audit_timestamp', 'audit_logs', ['timestamp'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_audit_timestamp', table_name='audit_logs')
    op.drop_index('idx_audit_action_timestamp', table_name='audit_logs')
    op.drop_index('idx_audit_entity', table_name='audit_logs')
    op.drop_index('idx_audit_user_timestamp', table_name='audit_logs')

    # Drop table
    op.drop_table('audit_logs')
