# -*- coding: utf-8 -*-
"""Service layer for clinical history subdomains."""

from datetime import date, datetime

from app.extensions import db
from app.models.clinical_history import (
    Anamnesis,
    ClinicalHistoryEvent,
    Evolution,
    PeriodontalRecord,
    Prescription,
)
from app.models.patient import Patient
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.services.patient_access_service import PatientAccessService
from app.utils.helpers import validate_required_fields


class _ClinicalHistoryBaseService:
    """Common helpers for patient-scoped clinical history services."""

    @staticmethod
    def _normalize_user_id(current_user_id):
        try:
            return int(current_user_id)
        except (TypeError, ValueError):
            raise ValidationError('Invalid current user context')

    @staticmethod
    def _has_patient_access(current_user_id, patient_id):
        return PatientAccessService.can_access_patient(current_user_id, patient_id)

    @classmethod
    def _ensure_patient_access(cls, current_user_id, patient_id):
        if not cls._has_patient_access(current_user_id, patient_id):
            raise AccessDeniedError('Unauthorized')

    @staticmethod
    def _get_patient_or_404(patient_id):
        patient = Patient.query.get(patient_id)
        if not patient:
            raise ResourceNotFoundError('Patient not found')
        return patient

    @staticmethod
    def _parse_optional_date(value, field_name):
        if value is None or value == '':
            return None
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise ValidationError(f'Invalid date format for {field_name}. Use YYYY-MM-DD')
        raise ValidationError(f'Invalid value for {field_name}')


class EvolutionService(_ClinicalHistoryBaseService):
    """Business logic for clinical evolution records."""

    @classmethod
    def list_evolutions(cls, current_user_id, patient_id=None, status=None, include_annulled=False):
        current_user_id = cls._normalize_user_id(current_user_id)

        if patient_id and not cls._has_patient_access(current_user_id, patient_id):
            raise AccessDeniedError('Unauthorized')

        if not patient_id and PatientAccessService.get_user_role(current_user_id) == 'patient':
            patient_id = current_user_id

        query = Evolution.query
        if patient_id:
            query = query.filter_by(patient_id=patient_id)
        if status:
            query = query.filter_by(status=status)
        if not include_annulled:
            query = query.filter(Evolution.status != 'annulled')

        return query.order_by(Evolution.created_at.desc()).all()

    @classmethod
    def create_evolution(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)

        required_fields = ['patient_id', 'action_performed']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        patient_id = data.get('patient_id')
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        evolution = Evolution(
            patient_id=patient_id,
            professional_id=current_user_id,
            treatment_plan_id=data.get('treatment_plan_id'),
            action_performed=data.get('action_performed'),
            notes=data.get('notes'),
            status=data.get('status', 'pending'),
        )
        db.session.add(evolution)
        db.session.flush()

        event = ClinicalHistoryEvent(
            patient_id=patient_id,
            professional_id=current_user_id,
            event_type='evolution',
            reference_type='evolution',
            reference_id=evolution.id,
            title='Nueva evolución registrada',
            description=data['action_performed'][:200] if data.get('action_performed') else None,
        )
        db.session.add(event)
        db.session.commit()
        return evolution

    @classmethod
    def get_evolution(cls, current_user_id, evolution_id):
        current_user_id = cls._normalize_user_id(current_user_id)
        evolution = cls._get_evolution_or_404(evolution_id)
        cls._ensure_patient_access(current_user_id, evolution.patient_id)
        return evolution

    @classmethod
    def update_evolution(cls, current_user_id, evolution_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        evolution = cls._get_evolution_or_404(evolution_id)
        cls._ensure_patient_access(current_user_id, evolution.patient_id)

        if evolution.status == 'annulled':
            raise ValidationError('Cannot modify annulled evolution')

        if 'action_performed' in data:
            evolution.action_performed = data['action_performed']
        if 'notes' in data:
            evolution.notes = data['notes']
        if 'treatment_plan_id' in data:
            evolution.treatment_plan_id = data['treatment_plan_id']

        db.session.add(evolution)
        db.session.commit()
        return evolution

    @classmethod
    def sign_evolution(cls, current_user_id, evolution_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        evolution = cls._get_evolution_or_404(evolution_id)
        cls._ensure_patient_access(current_user_id, evolution.patient_id)

        signer_type = data.get('signer_type')
        signature = data.get('signature')
        if not signer_type or not signature:
            raise ValidationError('signer_type and signature are required')

        if signer_type == 'professional':
            evolution.professional_signature = signature
            evolution.professional_signed_at = datetime.utcnow()
        elif signer_type == 'patient':
            evolution.patient_signature = signature
            evolution.patient_signed_at = datetime.utcnow()
        else:
            raise ValidationError('signer_type must be professional or patient')

        if evolution.professional_signature and evolution.patient_signature:
            evolution.status = 'signed'

        db.session.add(evolution)
        db.session.commit()
        return evolution

    @classmethod
    def annul_evolution(cls, current_user_id, evolution_id):
        current_user_id = cls._normalize_user_id(current_user_id)
        evolution = cls._get_evolution_or_404(evolution_id)
        cls._ensure_patient_access(current_user_id, evolution.patient_id)

        evolution.status = 'annulled'
        db.session.add(evolution)
        db.session.commit()
        return evolution

    @staticmethod
    def _get_evolution_or_404(evolution_id):
        evolution = Evolution.query.get(evolution_id)
        if not evolution:
            raise ResourceNotFoundError('Evolution not found')
        return evolution


class AnamnesisService(_ClinicalHistoryBaseService):
    """Business logic for anamnesis records."""

    @classmethod
    def get_patient_anamnesis(cls, current_user_id, patient_id):
        current_user_id = cls._normalize_user_id(current_user_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        anamnesis = Anamnesis.query.filter_by(patient_id=patient_id, is_active=True).first()
        if not anamnesis:
            raise ResourceNotFoundError('Anamnesis not found')
        return anamnesis

    @classmethod
    def create_or_update_anamnesis(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        patient_id = data.get('patient_id')
        if not patient_id:
            raise ValidationError('patient_id is required')

        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        anamnesis = Anamnesis.query.filter_by(patient_id=patient_id).first()
        parsed_last_dental_visit = (
            cls._parse_optional_date(data.get('last_dental_visit'), 'last_dental_visit')
            if 'last_dental_visit' in data
            else None
        )

        if anamnesis:
            update_fields = [
                'consultation_reason',
                'medical_alerts',
                'current_medications',
                'habits',
                'allergies',
                'other_conditions',
                'is_pregnant',
                'pregnancy_weeks',
                'notes',
            ]
            for field in update_fields:
                if field in data:
                    setattr(anamnesis, field, data[field])

            if 'last_dental_visit' in data:
                anamnesis.last_dental_visit = parsed_last_dental_visit
            anamnesis.professional_id = current_user_id
        else:
            anamnesis = Anamnesis(
                patient_id=patient_id,
                professional_id=current_user_id,
                consultation_reason=data.get('consultation_reason'),
                medical_alerts=data.get('medical_alerts'),
                current_medications=data.get('current_medications'),
                habits=data.get('habits'),
                allergies=data.get('allergies'),
                other_conditions=data.get('other_conditions'),
                is_pregnant=data.get('is_pregnant', False),
                pregnancy_weeks=data.get('pregnancy_weeks'),
                last_dental_visit=parsed_last_dental_visit,
                notes=data.get('notes'),
            )
            db.session.add(anamnesis)

        db.session.add(anamnesis)
        db.session.commit()
        return anamnesis


class PeriodontalRecordService(_ClinicalHistoryBaseService):
    """Business logic for periodontal records."""

    RECORD_FIELDS = [
        'probing_depth_mb',
        'probing_depth_b',
        'probing_depth_db',
        'probing_depth_ml',
        'probing_depth_l',
        'probing_depth_dl',
        'margin_mb',
        'margin_b',
        'margin_db',
        'margin_ml',
        'margin_l',
        'margin_dl',
        'furcation',
        'mobility',
        'bleeding',
        'plaque',
        'suppuration',
        'notes',
    ]

    @classmethod
    def list_records(cls, current_user_id, patient_id, measurement_date=None):
        current_user_id = cls._normalize_user_id(current_user_id)

        if not patient_id:
            raise ValidationError('patient_id is required')

        cls._ensure_patient_access(current_user_id, patient_id)

        query = PeriodontalRecord.query.filter_by(patient_id=patient_id)
        if measurement_date:
            parsed_date = cls._parse_optional_date(measurement_date, 'measurement_date')
            query = query.filter_by(measurement_date=parsed_date)

        return query.order_by(PeriodontalRecord.tooth_number).all()

    @classmethod
    def upsert_record(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)

        required_fields = ['patient_id', 'tooth_number']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        patient_id = data['patient_id']
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        measurement_date = cls._parse_optional_date(
            data.get('measurement_date'),
            'measurement_date',
        ) or datetime.utcnow().date()

        record = PeriodontalRecord.query.filter_by(
            patient_id=patient_id,
            tooth_number=data['tooth_number'],
            measurement_date=measurement_date,
        ).first()

        if record:
            for field in cls.RECORD_FIELDS:
                if field in data:
                    setattr(record, field, data[field])
            if 'odontogram_id' in data:
                record.odontogram_id = data.get('odontogram_id')
        else:
            record = PeriodontalRecord(
                patient_id=patient_id,
                professional_id=current_user_id,
                odontogram_id=data.get('odontogram_id'),
                measurement_date=measurement_date,
                tooth_number=data['tooth_number'],
                probing_depth_mb=data.get('probing_depth_mb'),
                probing_depth_b=data.get('probing_depth_b'),
                probing_depth_db=data.get('probing_depth_db'),
                probing_depth_ml=data.get('probing_depth_ml'),
                probing_depth_l=data.get('probing_depth_l'),
                probing_depth_dl=data.get('probing_depth_dl'),
                margin_mb=data.get('margin_mb'),
                margin_b=data.get('margin_b'),
                margin_db=data.get('margin_db'),
                margin_ml=data.get('margin_ml'),
                margin_l=data.get('margin_l'),
                margin_dl=data.get('margin_dl'),
                furcation=data.get('furcation'),
                mobility=data.get('mobility'),
                bleeding=data.get('bleeding', False),
                plaque=data.get('plaque', False),
                suppuration=data.get('suppuration', False),
                notes=data.get('notes'),
            )
            db.session.add(record)

        db.session.add(record)
        db.session.commit()
        return record

    @classmethod
    def bulk_upsert_records(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)

        if 'patient_id' not in data or 'records' not in data:
            raise ValidationError('patient_id and records are required')

        patient_id = data['patient_id']
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        measurement_date = cls._parse_optional_date(
            data.get('measurement_date'),
            'measurement_date',
        ) or datetime.utcnow().date()

        created_records = []
        for record_data in data['records']:
            if 'tooth_number' not in record_data:
                continue

            record = PeriodontalRecord.query.filter_by(
                patient_id=patient_id,
                tooth_number=record_data['tooth_number'],
                measurement_date=measurement_date,
            ).first()

            if record:
                for field in cls.RECORD_FIELDS:
                    if field in record_data:
                        setattr(record, field, record_data[field])
                if 'odontogram_id' in record_data:
                    record.odontogram_id = record_data.get('odontogram_id')
            else:
                record = PeriodontalRecord(
                    patient_id=patient_id,
                    professional_id=current_user_id,
                    measurement_date=measurement_date,
                    tooth_number=record_data['tooth_number'],
                    odontogram_id=record_data.get('odontogram_id'),
                )
                for field in cls.RECORD_FIELDS:
                    if field in record_data:
                        setattr(record, field, record_data[field])
                db.session.add(record)

            created_records.append(record)

        db.session.commit()
        return created_records


class PrescriptionService(_ClinicalHistoryBaseService):
    """Business logic for prescriptions."""

    @classmethod
    def list_prescriptions(cls, current_user_id, patient_id, treatment_id=None, include_annulled=False):
        current_user_id = cls._normalize_user_id(current_user_id)

        if not patient_id:
            raise ValidationError('patient_id is required')
        cls._ensure_patient_access(current_user_id, patient_id)

        query = Prescription.query.filter_by(patient_id=patient_id)
        if treatment_id:
            query = query.filter_by(treatment_id=treatment_id)
        if not include_annulled:
            query = query.filter(Prescription.status != 'annulled')

        return query.order_by(Prescription.prescription_date.desc()).all()

    @classmethod
    def create_prescription(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)

        required_fields = ['patient_id', 'content']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        patient_id = data.get('patient_id')
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        prescription = Prescription(
            patient_id=patient_id,
            professional_id=current_user_id,
            treatment_id=data.get('treatment_id'),
            content=data['content'],
            notes=data.get('notes'),
            professional_signature=data.get('professional_signature'),
        )
        db.session.add(prescription)
        db.session.flush()

        event = ClinicalHistoryEvent(
            patient_id=patient_id,
            professional_id=current_user_id,
            event_type='prescription',
            reference_type='prescription',
            reference_id=prescription.id,
            title='Nueva receta creada',
        )
        db.session.add(event)
        db.session.commit()
        return prescription

    @classmethod
    def annul_prescription(cls, current_user_id, prescription_id):
        current_user_id = cls._normalize_user_id(current_user_id)

        prescription = Prescription.query.get(prescription_id)
        if not prescription:
            raise ResourceNotFoundError('Prescription not found')

        cls._ensure_patient_access(current_user_id, prescription.patient_id)
        prescription.status = 'annulled'
        db.session.add(prescription)
        db.session.commit()
        return prescription
