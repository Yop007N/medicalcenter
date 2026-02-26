# -*- coding: utf-8 -*-
"""Service layer for clinical history subdomains."""

import json
import os
from datetime import date, datetime
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.clinical_history import (
    Anamnesis,
    ClinicalDocument,
    ClinicalHistoryEvent,
    Evolution,
    InformedConsent,
    PatientDocument,
    PeriodontalRecord,
    Prescription,
)
from app.models.patient import Patient
from app.models.professional import Professional
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

    @staticmethod
    def _resolve_professional_id(current_user_id, provided_professional_id=None):
        """
        Resolve a valid professional_id for records that reference professionals.
        - If current user is a professional, use own id.
        - Else, use provided professional_id when valid.
        - Else, return None for resources where professional context is optional.
        """
        current_professional = Professional.query.get(current_user_id)
        if current_professional:
            return current_user_id

        if provided_professional_id in (None, ''):
            return None

        try:
            provided_professional_id = int(provided_professional_id)
        except (TypeError, ValueError):
            raise ValidationError('professional_id must be an integer')

        if provided_professional_id <= 0:
            raise ValidationError('professional_id must be a positive integer')

        professional = Professional.query.get(provided_professional_id)
        if not professional:
            raise ResourceNotFoundError('Professional not found')

        return provided_professional_id


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

    @staticmethod
    def _normalize_string_list(value):
        if value in (None, ''):
            return []

        if isinstance(value, (list, tuple, set)):
            return [str(item).strip() for item in value if str(item).strip()]

        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []

            if (raw.startswith('[') and raw.endswith(']')) or (raw.startswith('{') and raw.endswith('}')):
                try:
                    parsed = json.loads(raw.replace("'", '"'))
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except (TypeError, ValueError, json.JSONDecodeError):
                    pass

            return [item.strip() for item in raw.split(',') if item.strip()]

        return [str(value).strip()] if str(value).strip() else []

    @staticmethod
    def _normalize_optional_text(value):
        if value in (None, ''):
            return None
        text = str(value).strip()
        return text or None

    @staticmethod
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

    @classmethod
    def _normalize_habits_payload(cls, data):
        raw_habits = data.get('habits')
        explicit_other = cls._normalize_optional_text(data.get('habits_other'))

        if isinstance(raw_habits, dict):
            habits = [
                str(key).strip()
                for key, enabled in raw_habits.items()
                if key != '_other' and bool(enabled) and str(key).strip()
            ]
            return habits, explicit_other or cls._normalize_optional_text(raw_habits.get('_other'))

        habits = cls._normalize_string_list(raw_habits)
        habits, implicit_other = cls._split_legacy_other(habits)
        return habits, explicit_other or implicit_other

    @classmethod
    def _extract_consultation_payload(cls, data):
        values = cls._normalize_string_list(data.get('consultation_reason'))
        values, implicit_other = cls._split_legacy_other(values)
        return values, cls._normalize_optional_text(data.get('consultation_reason_other')) or implicit_other

    @classmethod
    def _extract_current_illness_payload(cls, data):
        if 'current_illness' in data:
            values = cls._normalize_string_list(data.get('current_illness'))
            values, implicit_other = cls._split_legacy_other(values)
            other = cls._normalize_optional_text(data.get('current_illness_other')) or implicit_other
            return values, other

        legacy_other_conditions = cls._normalize_string_list(data.get('other_conditions'))
        legacy_other_conditions, implicit_other = cls._split_legacy_other(legacy_other_conditions)
        return legacy_other_conditions, cls._normalize_optional_text(data.get('current_illness_other')) or implicit_other

    @classmethod
    def _extract_medical_alerts_payload(cls, data):
        alerts = cls._normalize_string_list(data.get('medical_alerts'))
        alerts, implicit_other = cls._split_legacy_other(alerts)
        other = cls._normalize_optional_text(data.get('medical_alerts_other'))
        if not other:
            other = cls._normalize_optional_text(data.get('allergies'))
        return alerts, other or implicit_other

    @classmethod
    def _extract_medications_payload(cls, data):
        raw = data.get('medications') if 'medications' in data else data.get('current_medications')
        values = cls._normalize_string_list(raw)
        values, implicit_other = cls._split_legacy_other(values)
        return values, cls._normalize_optional_text(data.get('medications_other')) or implicit_other

    @staticmethod
    def _to_legacy_text(values, other=None, max_length=None):
        merged = ', '.join(values or [])
        if other:
            merged = f'{merged}. Otros: {other}' if merged else f'Otros: {other}'
        merged = merged or None
        if merged and max_length and len(merged) > max_length:
            return merged[:max_length]
        return merged

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
        if patient_id in (None, ''):
            raise ValidationError('patient_id is required')
        try:
            patient_id = int(patient_id)
        except (TypeError, ValueError):
            raise ValidationError('patient_id must be an integer')

        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        anamnesis = Anamnesis.query.filter_by(patient_id=patient_id).first()
        is_new = anamnesis is None
        professional_id = cls._resolve_professional_id(current_user_id, data.get('professional_id'))
        parsed_last_dental_visit = (
            cls._parse_optional_date(data.get('last_dental_visit'), 'last_dental_visit')
            if 'last_dental_visit' in data
            else None
        )

        if is_new:
            anamnesis = Anamnesis(patient_id=patient_id)

        if professional_id is not None:
            anamnesis.professional_id = professional_id

        if is_new or any(field in data for field in ('consultation_reason', 'consultation_reason_other')):
            consultation_reason, consultation_reason_other = cls._extract_consultation_payload(data)
            anamnesis.consultation_reason_items = consultation_reason
            anamnesis.consultation_reason_other = consultation_reason_other
            anamnesis.consultation_reason = cls._to_legacy_text(
                consultation_reason,
                consultation_reason_other,
                max_length=200,
            )

        if is_new or any(field in data for field in ('current_illness', 'current_illness_other', 'other_conditions')):
            current_illness, current_illness_other = cls._extract_current_illness_payload(data)
            anamnesis.current_illness = current_illness
            anamnesis.current_illness_other = current_illness_other
            anamnesis.other_conditions = cls._to_legacy_text(current_illness, current_illness_other)

        if is_new or any(field in data for field in ('medical_alerts', 'medical_alerts_other', 'allergies')):
            medical_alerts, medical_alerts_other = cls._extract_medical_alerts_payload(data)
            anamnesis.medical_alerts = medical_alerts
            anamnesis.medical_alerts_other = medical_alerts_other
            anamnesis.allergies = cls._normalize_optional_text(data.get('allergies')) or medical_alerts_other

        if is_new or any(field in data for field in ('medications', 'medications_other', 'current_medications')):
            medications, medications_other = cls._extract_medications_payload(data)
            anamnesis.medications = medications
            anamnesis.medications_other = medications_other
            anamnesis.current_medications = medications

        if is_new or any(field in data for field in ('habits', 'habits_other')):
            habits, habits_other = cls._normalize_habits_payload(data)
            anamnesis.habits = habits
            anamnesis.habits_other = habits_other

        if 'is_pregnant' in data:
            anamnesis.is_pregnant = bool(data.get('is_pregnant'))
        elif anamnesis.is_pregnant is None:
            anamnesis.is_pregnant = False

        if 'pregnancy_weeks' in data:
            anamnesis.pregnancy_weeks = data.get('pregnancy_weeks')

        if 'last_dental_visit' in data:
            anamnesis.last_dental_visit = parsed_last_dental_visit

        if 'notes' in data:
            anamnesis.notes = cls._normalize_optional_text(data.get('notes'))

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


class PatientDocumentService(_ClinicalHistoryBaseService):
    """Business logic for patient documents."""

    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'dcm', 'doc', 'docx'}

    @classmethod
    def list_documents(cls, current_user_id, patient_id, document_type=None, include_inactive=False):
        current_user_id = cls._normalize_user_id(current_user_id)
        if not patient_id:
            raise ValidationError('patient_id is required')

        cls._ensure_patient_access(current_user_id, patient_id)

        query = PatientDocument.query.filter_by(patient_id=patient_id)
        if document_type:
            query = query.filter_by(document_type=document_type)
        if not include_inactive:
            query = query.filter_by(is_active=True)

        return query.order_by(PatientDocument.created_at.desc()).all()

    @classmethod
    def create_document(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)

        required_fields = ['patient_id', 'document_type']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        patient_id = data['patient_id']
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        document = PatientDocument(
            patient_id=patient_id,
            professional_id=current_user_id,
            file_id=data.get('file_id'),
            document_type=data['document_type'],
            title=data.get('title'),
            description=data.get('description'),
            file_name=data.get('file_name'),
            file_path=data.get('file_path'),
            mime_type=data.get('mime_type'),
            file_size=data.get('file_size'),
            affected_teeth=data.get('affected_teeth'),
            document_date=cls._parse_optional_date(data.get('document_date'), 'document_date')
            if 'document_date' in data else datetime.utcnow().date(),
            is_active=data.get('is_active', True),
        )
        db.session.add(document)
        db.session.flush()

        event = ClinicalHistoryEvent(
            patient_id=patient_id,
            professional_id=current_user_id,
            event_type='document',
            reference_type='patient_document',
            reference_id=document.id,
            title=f'Documento agregado: {data.get("title", data["document_type"])}',
        )
        db.session.add(event)
        db.session.commit()
        return document

    @classmethod
    def delete_document(cls, current_user_id, document_id):
        current_user_id = cls._normalize_user_id(current_user_id)
        document = PatientDocument.query.get(document_id)
        if not document:
            raise ResourceNotFoundError('Document not found')

        cls._ensure_patient_access(current_user_id, document.patient_id)

        if document.file_path and os.path.exists(document.file_path):
            try:
                os.remove(document.file_path)
            except OSError:
                pass

        document.is_active = False
        db.session.add(document)
        db.session.commit()
        return document

    @classmethod
    def upload_document(cls, current_user_id, file_obj, form_data, upload_folder):
        current_user_id = cls._normalize_user_id(current_user_id)

        if file_obj is None:
            raise ValidationError('No file provided')
        if not getattr(file_obj, 'filename', None):
            raise ValidationError('No file selected')
        if not cls._allowed_file(file_obj.filename):
            raise ValidationError(
                'File type not allowed. Allowed types: pdf, png, jpg, jpeg, gif, dcm, doc, docx'
            )

        patient_id = cls._to_int(form_data.get('patient_id'))
        if not patient_id:
            raise ValidationError('patient_id is required')
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        document_type = form_data.get('document_type', 'other')
        title = form_data.get('title', '')
        description = form_data.get('description', '')
        affected_teeth = cls._parse_affected_teeth(form_data.get('affected_teeth'))

        original_filename = secure_filename(file_obj.filename)
        unique_filename = cls._generate_unique_filename(original_filename)
        upload_root = upload_folder if os.path.isabs(upload_folder) else os.path.abspath(upload_folder)
        patient_folder = os.path.join(upload_root, f'patient_{patient_id}')
        os.makedirs(patient_folder, exist_ok=True)
        file_path = os.path.join(patient_folder, unique_filename)

        file_obj.save(file_path)
        file_size = os.path.getsize(file_path)

        document = PatientDocument(
            patient_id=patient_id,
            professional_id=current_user_id,
            document_type=document_type,
            title=title or original_filename,
            description=description,
            file_name=original_filename,
            file_path=file_path,
            mime_type=getattr(file_obj, 'content_type', None),
            file_size=file_size,
            affected_teeth=affected_teeth,
            document_date=datetime.utcnow().date(),
        )
        db.session.add(document)
        db.session.flush()

        event = ClinicalHistoryEvent(
            patient_id=patient_id,
            professional_id=current_user_id,
            event_type='document',
            reference_type='patient_document',
            reference_id=document.id,
            title=f'Documento subido: {title or original_filename}',
        )
        db.session.add(event)
        db.session.commit()
        return document

    @classmethod
    def get_download_payload(cls, current_user_id, document_id):
        current_user_id = cls._normalize_user_id(current_user_id)
        document = PatientDocument.query.get(document_id)
        if not document:
            raise ResourceNotFoundError('Document not found')

        cls._ensure_patient_access(current_user_id, document.patient_id)

        resolved_file_path = (
            document.file_path
            if (document.file_path and os.path.isabs(document.file_path))
            else os.path.abspath(document.file_path or '')
        )

        if not document.file_path or not os.path.exists(resolved_file_path):
            raise ResourceNotFoundError('File not found on disk')

        return {
            'file_path': resolved_file_path,
            'download_name': document.file_name or 'document',
            'mimetype': document.mime_type or 'application/octet-stream',
        }

    @classmethod
    def _allowed_file(cls, filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in cls.ALLOWED_EXTENSIONS

    @staticmethod
    def _generate_unique_filename(original_filename):
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
        name, ext = os.path.splitext(secure_filename(original_filename))
        return f'{name}_{timestamp}{ext}'

    @staticmethod
    def _parse_affected_teeth(raw_value):
        if not raw_value:
            return None
        if isinstance(raw_value, (list, dict)):
            return raw_value
        try:
            return json.loads(raw_value)
        except (TypeError, ValueError, json.JSONDecodeError):
            return None

    @staticmethod
    def _to_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None


class ClinicalDocumentService(_ClinicalHistoryBaseService):
    """Business logic for generated clinical documents."""

    @classmethod
    def list_documents(cls, current_user_id, patient_id, document_type=None, include_inactive=False):
        current_user_id = cls._normalize_user_id(current_user_id)
        if not patient_id:
            raise ValidationError('patient_id is required')

        cls._ensure_patient_access(current_user_id, patient_id)

        query = ClinicalDocument.query.filter_by(patient_id=patient_id)
        if document_type:
            query = query.filter_by(document_type=document_type)
        if not include_inactive:
            query = query.filter_by(is_active=True)

        return query.order_by(ClinicalDocument.created_at.desc()).all()

    @classmethod
    def create_document(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        required_fields = ['patient_id', 'document_type', 'title']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        patient_id = data['patient_id']
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        document = ClinicalDocument(
            patient_id=patient_id,
            professional_id=current_user_id,
            document_type=data['document_type'],
            title=data['title'],
            content=data.get('content'),
            template_id=data.get('template_id'),
        )
        db.session.add(document)
        db.session.commit()
        return document

    @classmethod
    def delete_document(cls, current_user_id, doc_id):
        current_user_id = cls._normalize_user_id(current_user_id)
        document = ClinicalDocument.query.get(doc_id)
        if not document:
            raise ResourceNotFoundError('Document not found')

        cls._ensure_patient_access(current_user_id, document.patient_id)
        document.is_active = False
        db.session.add(document)
        db.session.commit()
        return document


class ConsentService(_ClinicalHistoryBaseService):
    """Business logic for informed consents."""

    @classmethod
    def list_consents(cls, current_user_id, patient_id, status=None):
        current_user_id = cls._normalize_user_id(current_user_id)
        if not patient_id:
            raise ValidationError('patient_id is required')
        cls._ensure_patient_access(current_user_id, patient_id)

        query = InformedConsent.query.filter_by(patient_id=patient_id)
        if status:
            query = query.filter_by(status=status)

        return query.order_by(InformedConsent.created_at.desc()).all()

    @classmethod
    def create_consent(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        required_fields = ['patient_id', 'consent_type', 'title']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        patient_id = data['patient_id']
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        consent = InformedConsent(
            patient_id=patient_id,
            professional_id=current_user_id,
            treatment_id=data.get('treatment_id'),
            consent_type=data['consent_type'],
            title=data['title'],
            content=data.get('content'),
            status='pending',
        )
        db.session.add(consent)
        db.session.flush()

        event = ClinicalHistoryEvent(
            patient_id=patient_id,
            professional_id=current_user_id,
            event_type='consent',
            reference_type='informed_consent',
            reference_id=consent.id,
            title=f'Consentimiento creado: {data["title"]}',
        )
        db.session.add(event)
        db.session.commit()
        return consent

    @classmethod
    def sign_consent(cls, current_user_id, consent_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        consent = InformedConsent.query.get(consent_id)
        if not consent:
            raise ResourceNotFoundError('Consent not found')

        cls._ensure_patient_access(current_user_id, consent.patient_id)

        if consent.status != 'pending':
            raise ValidationError('Consent is not pending')
        if 'patient_signature' not in data:
            raise ValidationError('patient_signature is required')

        consent.patient_signature = data['patient_signature']
        consent.patient_signed_at = datetime.utcnow()

        if data.get('guardian_signature'):
            consent.guardian_name = data.get('guardian_name')
            consent.guardian_relationship = data.get('guardian_relationship')
            consent.guardian_signature = data['guardian_signature']
            consent.guardian_signed_at = datetime.utcnow()

        consent.status = 'signed'
        db.session.add(consent)
        db.session.commit()
        return consent

    @classmethod
    def reject_consent(cls, current_user_id, consent_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        consent = InformedConsent.query.get(consent_id)
        if not consent:
            raise ResourceNotFoundError('Consent not found')

        cls._ensure_patient_access(current_user_id, consent.patient_id)

        if consent.status != 'pending':
            raise ValidationError('Consent is not pending')

        consent.status = 'rejected'
        consent.rejected_reason = data.get('reason')
        db.session.add(consent)
        db.session.commit()
        return consent


class TimelineService(_ClinicalHistoryBaseService):
    """Business logic for timeline events and patient summary."""

    @classmethod
    def list_events(cls, current_user_id, patient_id, event_type=None, limit=50):
        current_user_id = cls._normalize_user_id(current_user_id)
        if not patient_id:
            raise ValidationError('patient_id is required')
        cls._ensure_patient_access(current_user_id, patient_id)

        query = ClinicalHistoryEvent.query.filter_by(patient_id=patient_id, is_active=True)
        if event_type:
            query = query.filter_by(event_type=event_type)

        return query.order_by(ClinicalHistoryEvent.event_date.desc()).limit(limit).all()

    @classmethod
    def create_manual_event(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        required_fields = ['patient_id', 'event_type', 'title']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        if data['event_type'] not in ['note', 'alert']:
            raise ValidationError('event_type must be note or alert for manual events')

        patient_id = data['patient_id']
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        event = ClinicalHistoryEvent(
            patient_id=patient_id,
            professional_id=current_user_id,
            event_type=data['event_type'],
            title=data['title'],
            description=data.get('description'),
            is_important=data.get('is_important', data['event_type'] == 'alert'),
        )
        db.session.add(event)
        db.session.commit()
        return event

    @classmethod
    def get_summary(cls, current_user_id, patient_id):
        current_user_id = cls._normalize_user_id(current_user_id)
        cls._get_patient_or_404(patient_id)
        cls._ensure_patient_access(current_user_id, patient_id)

        evolutions_count = Evolution.query.filter_by(patient_id=patient_id).filter(
            Evolution.status != 'annulled'
        ).count()
        prescriptions_count = Prescription.query.filter_by(patient_id=patient_id).filter(
            Prescription.status != 'annulled'
        ).count()
        documents_count = PatientDocument.query.filter_by(patient_id=patient_id, is_active=True).count()
        clinical_docs_count = ClinicalDocument.query.filter_by(patient_id=patient_id, is_active=True).count()
        consents_pending = InformedConsent.query.filter_by(patient_id=patient_id, status='pending').count()
        consents_signed = InformedConsent.query.filter_by(patient_id=patient_id, status='signed').count()

        anamnesis = Anamnesis.query.filter_by(patient_id=patient_id, is_active=True).first()
        recent_events = ClinicalHistoryEvent.query.filter_by(
            patient_id=patient_id,
            is_active=True,
        ).order_by(ClinicalHistoryEvent.event_date.desc()).limit(5).all()

        return {
            'patient_id': patient_id,
            'has_anamnesis': anamnesis is not None,
            'medical_alerts': anamnesis.medical_alerts if anamnesis else [],
            'counts': {
                'evolutions': evolutions_count,
                'prescriptions': prescriptions_count,
                'documents': documents_count,
                'clinical_documents': clinical_docs_count,
                'consents_pending': consents_pending,
                'consents_signed': consents_signed,
            },
            'recent_events': recent_events,
        }
