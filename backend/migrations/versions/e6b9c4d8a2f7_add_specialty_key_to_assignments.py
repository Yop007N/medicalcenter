# -*- coding: utf-8 -*-
"""Add specialty_key to professional-patient assignments.

Revision ID: e6b9c4d8a2f7
Revises: c1f4a8b9d2e3
Create Date: 2026-02-26 23:25:00.000000
"""

from __future__ import annotations

import unicodedata
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e6b9c4d8a2f7"
down_revision: Union[str, None] = "c1f4a8b9d2e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _normalize(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return ascii_only.strip().lower()


def _resolve_specialty_key(raw_specialty: str | None) -> str | None:
    normalized = _normalize(raw_specialty)
    if not normalized:
        return None

    rules = [
        ("odontology", ("odont", "ortodon", "odontopedi")),
        ("psychopedagogy", ("psicopedag",)),
        ("psychology", ("psicolog", "psiquiatr")),
        ("cardiology", ("cardio",)),
        ("pediatrics", ("pediatr",)),
        ("gynecology", ("gineco", "obstetric")),
        ("traumatology", ("traumat", "ortoped")),
        ("neurology", ("neurolog",)),
        ("internal-medicine", ("medicina interna", "internal medicine", "clinica medica")),
        ("dermatology", ("dermatolog",)),
        ("endocrinology", ("endocrin",)),
        ("gastroenterology", ("gastroenter",)),
        ("pulmonology", ("neumolog", "pulmonolog")),
        ("urology", ("urolog",)),
        ("nephrology", ("nefrolog",)),
        ("oncology", ("oncolog",)),
        ("otolaryngology", ("otorrino", "otolaryng")),
        ("ophthalmology", ("oftalmolog", "oculist")),
        ("rheumatology", ("reumatolog",)),
        ("infectology", ("infectolog",)),
        ("nutrition", ("nutricion", "nutrition", "nutricionista")),
        ("physiotherapy", ("fisioterapia", "physiotherapy", "kinesiolog")),
        ("nursing", ("enfermer", "nursing")),
        ("general-medicine", ("medicina general", "general medicine", "general practice", "generalista")),
    ]

    for key, aliases in rules:
        if any(alias in normalized for alias in aliases):
            return key
    return None


def upgrade() -> None:
    op.add_column(
        "professional_patient_assignments",
        sa.Column("specialty_key", sa.String(length=64), nullable=True),
    )
    op.create_index(
        "ix_prof_patient_assignments_professional_specialty",
        "professional_patient_assignments",
        ["professional_id", "specialty_key"],
        unique=False,
    )

    bind = op.get_bind()
    assignments = sa.table(
        "professional_patient_assignments",
        sa.column("professional_id", sa.Integer),
        sa.column("patient_id", sa.Integer),
        sa.column("specialty_key", sa.String),
    )
    professionals = sa.table(
        "professionals",
        sa.column("id", sa.Integer),
        sa.column("specialty", sa.String),
    )

    rows = bind.execute(
        sa.select(
            assignments.c.professional_id,
            assignments.c.patient_id,
            professionals.c.specialty,
        ).select_from(
            assignments.join(
                professionals,
                professionals.c.id == assignments.c.professional_id,
            )
        )
    ).all()

    for professional_id, patient_id, specialty in rows:
        specialty_key = _resolve_specialty_key(specialty)
        if not specialty_key:
            continue
        bind.execute(
            sa.update(assignments)
            .where(
                sa.and_(
                    assignments.c.professional_id == professional_id,
                    assignments.c.patient_id == patient_id,
                )
            )
            .values(specialty_key=specialty_key)
        )


def downgrade() -> None:
    op.drop_index(
        "ix_prof_patient_assignments_professional_specialty",
        table_name="professional_patient_assignments",
    )
    op.drop_column("professional_patient_assignments", "specialty_key")
