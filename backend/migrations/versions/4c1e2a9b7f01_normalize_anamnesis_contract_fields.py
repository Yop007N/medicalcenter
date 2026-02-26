"""Normalize anamnesis contract fields

Revision ID: 4c1e2a9b7f01
Revises: f0e1d2c3b4a5
Create Date: 2026-02-25 12:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import json


# revision identifiers, used by Alembic.
revision: str = '4c1e2a9b7f01'
down_revision: Union[str, None] = 'f0e1d2c3b4a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _normalize_optional_text(value):
    if value in (None, ''):
        return None
    text = str(value).strip()
    return text or None


def _normalize_list(value):
    if value in (None, ''):
        return []

    if isinstance(value, (list, tuple, set)):
        return [str(item).strip() for item in value if str(item).strip()]

    if isinstance(value, dict):
        return [
            str(key).strip()
            for key, enabled in value.items()
            if key != '_other' and bool(enabled) and str(key).strip()
        ]

    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return []

        if (raw.startswith('[') and raw.endswith(']')) or (raw.startswith('{') and raw.endswith('}')):
            try:
                parsed = json.loads(raw.replace("'", '"'))
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
                if isinstance(parsed, dict):
                    return [
                        str(key).strip()
                        for key, enabled in parsed.items()
                        if key != '_other' and bool(enabled) and str(key).strip()
                    ]
            except (TypeError, ValueError, json.JSONDecodeError):
                pass

        return [item.strip() for item in raw.split(',') if item.strip()]

    text = str(value).strip()
    return [text] if text else []


def _split_legacy_other(values):
    clean_values = []
    other = None

    for raw_item in values:
        item = str(raw_item).strip()
        if not item:
            continue

        lowered = item.lower()
        if lowered.startswith('other:') or lowered.startswith('otros:'):
            extracted = item.split(':', 1)[1].strip()
            if extracted:
                other = extracted
            continue

        legacy_match = item.replace('Otros:', 'other:').replace('OTROS:', 'other:')
        if 'other:' in legacy_match:
            left, right = legacy_match.split('other:', 1)
            left = left.strip().rstrip('.,;:')
            right = right.strip()
            if left:
                clean_values.append(left)
            if right:
                other = right
            continue

        clean_values.append(item)

    return clean_values, other


def _to_json_or_none(values):
    return values if values else None


def _backfill_anamnesis_data() -> None:
    bind = op.get_bind()
    anamnesis_table = sa.table(
        'anamnesis',
        sa.column('id', sa.Integer),
        sa.column('consultation_reason', sa.Text),
        sa.column('other_conditions', sa.Text),
        sa.column('medical_alerts', sa.JSON),
        sa.column('current_medications', sa.JSON),
        sa.column('habits', sa.JSON),
        sa.column('allergies', sa.Text),
        sa.column('consultation_reason_items', sa.JSON),
        sa.column('consultation_reason_other', sa.Text),
        sa.column('current_illness', sa.JSON),
        sa.column('current_illness_other', sa.Text),
        sa.column('medical_alerts_other', sa.Text),
        sa.column('medications', sa.JSON),
        sa.column('medications_other', sa.Text),
        sa.column('habits_other', sa.Text),
    )

    rows = bind.execute(
        sa.select(
            anamnesis_table.c.id,
            anamnesis_table.c.consultation_reason,
            anamnesis_table.c.other_conditions,
            anamnesis_table.c.medical_alerts,
            anamnesis_table.c.current_medications,
            anamnesis_table.c.habits,
            anamnesis_table.c.allergies,
        )
    ).mappings().all()

    for row in rows:
        consultation_values, consultation_other = _split_legacy_other(
            _normalize_list(row['consultation_reason'])
        )

        current_illness_values, current_illness_other = _split_legacy_other(
            _normalize_list(row['other_conditions'])
        )

        medical_alert_values, medical_alert_other = _split_legacy_other(
            _normalize_list(row['medical_alerts'])
        )

        medication_values, medication_other = _split_legacy_other(
            _normalize_list(row['current_medications'])
        )

        raw_habits = row['habits']
        if isinstance(raw_habits, dict):
            habits_values = [
                str(key).strip()
                for key, enabled in raw_habits.items()
                if key != '_other' and bool(enabled) and str(key).strip()
            ]
            habits_other = _normalize_optional_text(raw_habits.get('_other'))
        else:
            habits_values, habits_other = _split_legacy_other(_normalize_list(raw_habits))

        fallback_allergy_text = _normalize_optional_text(row['allergies'])

        bind.execute(
            sa.update(anamnesis_table)
            .where(anamnesis_table.c.id == row['id'])
            .values(
                consultation_reason_items=_to_json_or_none(consultation_values),
                consultation_reason_other=_normalize_optional_text(consultation_other),
                current_illness=_to_json_or_none(current_illness_values),
                current_illness_other=_normalize_optional_text(current_illness_other),
                medical_alerts_other=_normalize_optional_text(medical_alert_other) or fallback_allergy_text,
                medications=_to_json_or_none(medication_values),
                medications_other=_normalize_optional_text(medication_other),
                habits_other=_normalize_optional_text(habits_other),
            )
        )


def upgrade() -> None:
    op.add_column('anamnesis', sa.Column('consultation_reason_items', sa.JSON(), nullable=True))
    op.add_column('anamnesis', sa.Column('consultation_reason_other', sa.Text(), nullable=True))
    op.add_column('anamnesis', sa.Column('current_illness', sa.JSON(), nullable=True))
    op.add_column('anamnesis', sa.Column('current_illness_other', sa.Text(), nullable=True))
    op.add_column('anamnesis', sa.Column('medical_alerts_other', sa.Text(), nullable=True))
    op.add_column('anamnesis', sa.Column('medications', sa.JSON(), nullable=True))
    op.add_column('anamnesis', sa.Column('medications_other', sa.Text(), nullable=True))
    op.add_column('anamnesis', sa.Column('habits_other', sa.Text(), nullable=True))

    _backfill_anamnesis_data()


def downgrade() -> None:
    op.drop_column('anamnesis', 'habits_other')
    op.drop_column('anamnesis', 'medications_other')
    op.drop_column('anamnesis', 'medications')
    op.drop_column('anamnesis', 'medical_alerts_other')
    op.drop_column('anamnesis', 'current_illness_other')
    op.drop_column('anamnesis', 'current_illness')
    op.drop_column('anamnesis', 'consultation_reason_other')
    op.drop_column('anamnesis', 'consultation_reason_items')
