# -*- coding: utf-8 -*-
"""Service layer for odontogram and tooth operations."""

from app.extensions import db
from app.models.odontogram import Odontogram, Tooth
from app.models.patient import Patient
from app.models.professional import Professional
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.utils.helpers import validate_required_fields


class OdontogramService:
    """Encapsulates odontogram business logic."""

    TOOTH_FIELDS = [
        'tooth_type',
        'status',
        'mesial',
        'distal',
        'oclusal',
        'vestibular',
        'lingual',
        'notes',
        'sensitivity',
        'mobility',
        'gingival_status',
        'pocket_depth',
        'planned_treatment',
        'treatment_priority',
    ]

    @staticmethod
    def list_odontograms(patient_id=None):
        query = Odontogram.query
        if patient_id:
            query = query.filter_by(patient_id=patient_id)
        return query.order_by(Odontogram.created_at.desc()).all()

    @staticmethod
    def get_patient_odontogram(patient_id):
        patient = Patient.query.get(patient_id)
        if not patient:
            raise ResourceNotFoundError('Patient not found')

        odontogram = Odontogram.query.filter_by(
            patient_id=patient_id,
            is_active=True,
        ).first()
        if not odontogram:
            raise ResourceNotFoundError('No active odontogram found for this patient')

        teeth = odontogram.teeth.all()
        return {
            'id': odontogram.id,
            'patient_id': odontogram.patient_id,
            'professional_id': odontogram.professional_id,
            'notes': odontogram.notes,
            'is_active': odontogram.is_active,
            'created_at': odontogram.created_at.isoformat() if odontogram.created_at else None,
            'updated_at': odontogram.updated_at.isoformat() if odontogram.updated_at else None,
            'teeth': teeth,
        }

    @classmethod
    def create_odontogram(cls, current_user_id, data):
        required_fields = ['patient_id']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        patient = Patient.query.get(data['patient_id'])
        if not patient:
            raise ResourceNotFoundError('Patient not found')

        current_professional = Professional.query.get(current_user_id)
        provided_professional_id = data.get('professional_id')

        if provided_professional_id is not None:
            try:
                provided_professional_id = int(provided_professional_id)
            except (TypeError, ValueError):
                raise ValidationError('professional_id must be an integer')
            if provided_professional_id <= 0:
                raise ValidationError('professional_id must be a positive integer')

        if current_professional:
            # Professional users must create records under their own professional identity.
            professional_id = current_user_id
            if provided_professional_id and provided_professional_id != professional_id:
                raise ValidationError('professional users cannot override professional_id')
        else:
            # Admin users need an explicit professional context.
            professional_id = provided_professional_id
            if not professional_id:
                raise ValidationError('professional_id is required for non-professional users')

        professional = Professional.query.get(professional_id)
        if not professional:
            raise ResourceNotFoundError('Professional not found')

        previous = Odontogram.query.filter_by(
            patient_id=data['patient_id'],
            is_active=True,
        ).first()
        if previous:
            previous.is_active = False

        odontogram = Odontogram(
            patient_id=data['patient_id'],
            professional_id=professional_id,
            notes=data.get('notes'),
            is_active=True,
        )
        db.session.add(odontogram)
        db.session.flush()

        for tooth_data in data.get('teeth', []):
            tooth_number = tooth_data.get('tooth_number')
            if tooth_number is None:
                continue

            tooth = Tooth(
                odontogram_id=odontogram.id,
                tooth_number=tooth_number,
                tooth_type=tooth_data.get('tooth_type', 'permanent'),
                status=tooth_data.get('status', 'healthy'),
                mesial=tooth_data.get('mesial'),
                distal=tooth_data.get('distal'),
                oclusal=tooth_data.get('oclusal'),
                vestibular=tooth_data.get('vestibular'),
                lingual=tooth_data.get('lingual'),
                notes=tooth_data.get('notes'),
                sensitivity=tooth_data.get('sensitivity'),
                mobility=tooth_data.get('mobility'),
                gingival_status=tooth_data.get('gingival_status'),
                pocket_depth=tooth_data.get('pocket_depth'),
                planned_treatment=tooth_data.get('planned_treatment'),
                treatment_priority=tooth_data.get('treatment_priority'),
            )
            db.session.add(tooth)

        db.session.commit()
        return odontogram

    @staticmethod
    def get_odontogram(odontogram_id):
        odontogram = Odontogram.query.get(odontogram_id)
        if not odontogram:
            raise ResourceNotFoundError('Odontogram not found')
        return odontogram

    @staticmethod
    def update_odontogram(odontogram_id, data):
        odontogram = Odontogram.query.get(odontogram_id)
        if not odontogram:
            raise ResourceNotFoundError('Odontogram not found')

        if 'notes' in data:
            odontogram.notes = data['notes']
        if 'is_active' in data:
            odontogram.is_active = data['is_active']

        db.session.add(odontogram)
        db.session.commit()
        return odontogram

    @classmethod
    def add_or_update_tooth(cls, odontogram_id, data):
        cls.get_odontogram(odontogram_id)

        required_fields = ['tooth_number']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        tooth_number = data['tooth_number']
        if not cls._is_valid_tooth_number(tooth_number):
            raise ValidationError(
                'Invalid tooth number. Must be valid FDI notation (11-48 for permanent, 51-85 for deciduous)'
            )

        tooth = Tooth.query.filter_by(
            odontogram_id=odontogram_id,
            tooth_number=tooth_number,
        ).first()

        created = False
        if tooth:
            cls._apply_tooth_updates(tooth, data)
        else:
            tooth = Tooth(
                odontogram_id=odontogram_id,
                tooth_number=tooth_number,
                tooth_type=data.get('tooth_type', 'permanent'),
                status=data.get('status', 'healthy'),
                mesial=data.get('mesial'),
                distal=data.get('distal'),
                oclusal=data.get('oclusal'),
                vestibular=data.get('vestibular'),
                lingual=data.get('lingual'),
                notes=data.get('notes'),
                sensitivity=data.get('sensitivity'),
                mobility=data.get('mobility'),
                gingival_status=data.get('gingival_status'),
                pocket_depth=data.get('pocket_depth'),
                planned_treatment=data.get('planned_treatment'),
                treatment_priority=data.get('treatment_priority'),
            )
            db.session.add(tooth)
            created = True

        db.session.commit()
        return tooth, created

    @classmethod
    def list_teeth(cls, odontogram_id):
        odontogram = cls.get_odontogram(odontogram_id)
        return odontogram.teeth.all()

    @staticmethod
    def get_tooth(odontogram_id, tooth_number):
        tooth = Tooth.query.filter_by(
            odontogram_id=odontogram_id,
            tooth_number=tooth_number,
        ).first()
        if not tooth:
            raise ResourceNotFoundError('Tooth not found')
        return tooth

    @classmethod
    def upsert_tooth(cls, odontogram_id, tooth_number, data):
        cls.get_odontogram(odontogram_id)
        tooth = Tooth.query.filter_by(
            odontogram_id=odontogram_id,
            tooth_number=tooth_number,
        ).first()

        if tooth:
            cls._apply_tooth_updates(tooth, data)
        else:
            tooth = Tooth(
                odontogram_id=odontogram_id,
                tooth_number=tooth_number,
                tooth_type=data.get('tooth_type', 'permanent'),
                status=data.get('status', 'healthy'),
                mesial=data.get('mesial'),
                distal=data.get('distal'),
                oclusal=data.get('oclusal'),
                vestibular=data.get('vestibular'),
                lingual=data.get('lingual'),
                notes=data.get('notes'),
                sensitivity=data.get('sensitivity'),
                mobility=data.get('mobility'),
                gingival_status=data.get('gingival_status'),
                pocket_depth=data.get('pocket_depth'),
                planned_treatment=data.get('planned_treatment'),
                treatment_priority=data.get('treatment_priority'),
            )
            db.session.add(tooth)

        db.session.commit()
        return tooth

    @staticmethod
    def delete_tooth(odontogram_id, tooth_number):
        tooth = Tooth.query.filter_by(
            odontogram_id=odontogram_id,
            tooth_number=tooth_number,
        ).first()
        if not tooth:
            raise ResourceNotFoundError('Tooth not found')

        db.session.delete(tooth)
        db.session.commit()

    @classmethod
    def _apply_tooth_updates(cls, tooth, data):
        for field in cls.TOOTH_FIELDS:
            if field in data:
                setattr(tooth, field, data[field])

    @staticmethod
    def _is_valid_tooth_number(tooth_number):
        valid_ranges = [
            (11, 18), (21, 28), (31, 38), (41, 48),
            (51, 55), (61, 65), (71, 75), (81, 85),
        ]
        return any(start <= tooth_number <= end for start, end in valid_ranges)
