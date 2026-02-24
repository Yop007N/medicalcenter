# -*- coding: utf-8 -*-
"""
Clinical History CRUD endpoints
"""

import os
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime

from app.models.clinical_history import (
    Evolution, Anamnesis, PeriodontalRecord, PatientDocument,
    Prescription, ClinicalDocument, InformedConsent, ClinicalHistoryEvent
)
from app.models.patient import Patient
from app.schemas.clinical_history_schema import (
    EvolutionSchema, AnamnesisSchema, PeriodontalRecordSchema,
    PatientDocumentSchema, PrescriptionSchema, ClinicalDocumentSchema,
    InformedConsentSchema, ClinicalHistoryEventSchema
)
from app.extensions import db
from app.services.clinical_history_service import (
    AnamnesisService,
    EvolutionService,
    PeriodontalRecordService,
    PrescriptionService,
)
from app.services.exceptions import (
    AccessDeniedError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)
from app.services.patient_access_service import PatientAccessService
from app.utils.helpers import validate_required_fields

# File upload configuration
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'dcm', 'doc', 'docx'}
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'storage/clinical_documents')


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_unique_filename(original_filename):
    """Generate unique filename with timestamp"""
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
    name, ext = os.path.splitext(secure_filename(original_filename))
    return f"{name}_{timestamp}{ext}"

blueprint = Blueprint('clinical_history', __name__, url_prefix='/api/clinical-history')

# Schema instances
evolution_schema = EvolutionSchema()
evolutions_schema = EvolutionSchema(many=True)
anamnesis_schema = AnamnesisSchema()
periodontal_schema = PeriodontalRecordSchema()
periodontal_records_schema = PeriodontalRecordSchema(many=True)
document_schema = PatientDocumentSchema()
documents_schema = PatientDocumentSchema(many=True)
prescription_schema = PrescriptionSchema()
prescriptions_schema = PrescriptionSchema(many=True)
clinical_doc_schema = ClinicalDocumentSchema()
clinical_docs_schema = ClinicalDocumentSchema(many=True)
consent_schema = InformedConsentSchema()
consents_schema = InformedConsentSchema(many=True)
event_schema = ClinicalHistoryEventSchema()
events_schema = ClinicalHistoryEventSchema(many=True)


def _has_patient_access(patient_id):
    """Delegates access check to centralized policy service."""
    return PatientAccessService.can_access_patient(get_jwt_identity(), patient_id)


def _service_error_response(error):
    """Map service-layer errors to HTTP responses."""
    status_map = {
        ValidationError: 400,
        AccessDeniedError: 403,
        ResourceNotFoundError: 404,
        ConflictError: 409,
    }
    status = status_map.get(type(error), 400)
    payload = {'msg': error.message}
    if getattr(error, 'details', None):
        payload.update(error.details)
    return jsonify(payload), status


# ==================== EVOLUTIONS ====================

@blueprint.route('/evolutions', methods=['GET'])
@jwt_required()
def list_evolutions():
    """List evolutions with optional filters"""
    try:
        evolutions = EvolutionService.list_evolutions(
            current_user_id=get_jwt_identity(),
            patient_id=request.args.get('patient_id', type=int),
            status=request.args.get('status'),
            include_annulled=request.args.get('include_annulled', 'false').lower() == 'true',
        )
        return jsonify(evolutions_schema.dump(evolutions)), 200
    except (ValidationError, AccessDeniedError) as error:
        return _service_error_response(error)


@blueprint.route('/evolutions', methods=['POST'])
@jwt_required()
def create_evolution():
    """Create new evolution"""
    try:
        evolution = EvolutionService.create_evolution(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(evolution_schema.dump(evolution)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/evolutions/<int:evolution_id>', methods=['GET'])
@jwt_required()
def get_evolution(evolution_id):
    """Get evolution by ID"""
    try:
        evolution = EvolutionService.get_evolution(
            current_user_id=get_jwt_identity(),
            evolution_id=evolution_id,
        )
        return jsonify(evolution_schema.dump(evolution)), 200
    except (AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/evolutions/<int:evolution_id>', methods=['PUT'])
@jwt_required()
def update_evolution(evolution_id):
    """Update evolution"""
    try:
        evolution = EvolutionService.update_evolution(
            current_user_id=get_jwt_identity(),
            evolution_id=evolution_id,
            data=request.get_json() or {},
        )
        return jsonify(evolution_schema.dump(evolution)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/evolutions/<int:evolution_id>/sign', methods=['POST'])
@jwt_required()
def sign_evolution(evolution_id):
    """Sign evolution (professional or patient)"""
    try:
        evolution = EvolutionService.sign_evolution(
            current_user_id=get_jwt_identity(),
            evolution_id=evolution_id,
            data=request.get_json() or {},
        )
        return jsonify(evolution_schema.dump(evolution)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/evolutions/<int:evolution_id>/annul', methods=['POST'])
@jwt_required()
def annul_evolution(evolution_id):
    """Annul evolution"""
    try:
        evolution = EvolutionService.annul_evolution(
            current_user_id=get_jwt_identity(),
            evolution_id=evolution_id,
        )
        return jsonify(evolution_schema.dump(evolution)), 200
    except (AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


# ==================== ANAMNESIS ====================

@blueprint.route('/anamnesis/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_anamnesis(patient_id):
    """Get anamnesis for a patient"""
    try:
        anamnesis = AnamnesisService.get_patient_anamnesis(
            current_user_id=get_jwt_identity(),
            patient_id=patient_id,
        )
        return jsonify(anamnesis_schema.dump(anamnesis)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/anamnesis', methods=['POST'])
@jwt_required()
def create_or_update_anamnesis():
    """Create or update patient anamnesis"""
    try:
        anamnesis = AnamnesisService.create_or_update_anamnesis(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(anamnesis_schema.dump(anamnesis)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


# ==================== PERIODONTAL RECORDS ====================

@blueprint.route('/periodontal', methods=['GET'])
@jwt_required()
def list_periodontal_records():
    """List periodontal records with optional filters"""
    try:
        records = PeriodontalRecordService.list_records(
            current_user_id=get_jwt_identity(),
            patient_id=request.args.get('patient_id', type=int),
            measurement_date=request.args.get('measurement_date'),
        )
        return jsonify(periodontal_records_schema.dump(records)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/periodontal', methods=['POST'])
@jwt_required()
def create_periodontal_record():
    """Create or update periodontal record for a tooth"""
    try:
        record = PeriodontalRecordService.upsert_record(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(periodontal_schema.dump(record)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/periodontal/bulk', methods=['POST'])
@jwt_required()
def bulk_create_periodontal():
    """Bulk create/update periodontal records"""
    try:
        created_records = PeriodontalRecordService.bulk_upsert_records(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(periodontal_records_schema.dump(created_records)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


# ==================== PATIENT DOCUMENTS ====================

@blueprint.route('/documents', methods=['GET'])
@jwt_required()
def list_documents():
    """List patient documents"""
    patient_id = request.args.get('patient_id', type=int)
    document_type = request.args.get('document_type')
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

    if not patient_id:
        return jsonify({'msg': 'patient_id is required'}), 400
    if not _has_patient_access(patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    query = PatientDocument.query.filter_by(patient_id=patient_id)

    if document_type:
        query = query.filter_by(document_type=document_type)
    if not include_inactive:
        query = query.filter_by(is_active=True)

    documents = query.order_by(PatientDocument.created_at.desc()).all()
    return jsonify(documents_schema.dump(documents)), 200


@blueprint.route('/documents', methods=['POST'])
@jwt_required()
def create_document():
    """Create patient document"""
    data = request.get_json() or {}

    required_fields = ['patient_id', 'document_type']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({'msg': 'Missing required fields', 'missing_fields': missing_fields}), 400

    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404
    if not _has_patient_access(data['patient_id']):
        return jsonify({'msg': 'Unauthorized'}), 403

    document = PatientDocument(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        file_id=data.get('file_id'),
        document_type=data['document_type'],
        title=data.get('title'),
        description=data.get('description'),
        affected_teeth=data.get('affected_teeth'),
        document_date=data.get('document_date')
    )
    db.session.add(document)

    # Create timeline event
    event = ClinicalHistoryEvent(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        event_type='document',
        reference_type='patient_document',
        title=f'Documento agregado: {data.get("title", data["document_type"])}'
    )
    db.session.add(event)
    db.session.commit()

    event.reference_id = document.id
    db.session.commit()

    return jsonify(document_schema.dump(document)), 201


@blueprint.route('/documents/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    """Soft delete patient document"""
    document = PatientDocument.query.get(document_id)
    if not document:
        return jsonify({'msg': 'Document not found'}), 404
    if not _has_patient_access(document.patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    # Delete physical file if exists
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except OSError:
            pass  # File already deleted or inaccessible

    document.is_active = False
    db.session.commit()
    return jsonify({'msg': 'Document deleted successfully'}), 200


@blueprint.route('/documents/upload', methods=['POST'])
@jwt_required()
def upload_document():
    """Upload patient document with file.

    Accepts multipart/form-data with:
    - file: The file to upload
    - patient_id: Patient ID (required)
    - document_type: Type of document (required)
    - title: Document title (optional)
    - description: Description (optional)
    - affected_teeth: JSON array of tooth numbers (optional)
    """
    current_user_id = int(get_jwt_identity())

    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({'msg': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'msg': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'msg': 'File type not allowed. Allowed types: pdf, png, jpg, jpeg, gif, dcm, doc, docx'}), 400

    # Get form data
    patient_id = request.form.get('patient_id', type=int)
    document_type = request.form.get('document_type', 'other')
    title = request.form.get('title', '')
    description = request.form.get('description', '')
    affected_teeth_str = request.form.get('affected_teeth', '')

    if not patient_id:
        return jsonify({'msg': 'patient_id is required'}), 400

    # Verify patient exists
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404
    if not _has_patient_access(patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    # Parse affected teeth if provided
    affected_teeth = None
    if affected_teeth_str:
        try:
            import json
            affected_teeth = json.loads(affected_teeth_str)
        except (json.JSONDecodeError, ValueError):
            pass

    # Generate unique filename and storage path
    original_filename = secure_filename(file.filename)
    unique_filename = generate_unique_filename(original_filename)

    # Create patient-specific folder
    patient_folder = os.path.join(UPLOAD_FOLDER, f"patient_{patient_id}")
    os.makedirs(patient_folder, exist_ok=True)

    # Full file path
    file_path = os.path.join(patient_folder, unique_filename)

    # Save file
    file.save(file_path)

    # Get file size
    file_size = os.path.getsize(file_path)

    # Create document record
    document = PatientDocument(
        patient_id=patient_id,
        professional_id=current_user_id,
        document_type=document_type,
        title=title or original_filename,
        description=description,
        file_name=original_filename,
        file_path=file_path,
        mime_type=file.content_type,
        file_size=file_size,
        affected_teeth=affected_teeth,
        document_date=datetime.utcnow().date()
    )
    db.session.add(document)

    # Create timeline event
    event = ClinicalHistoryEvent(
        patient_id=patient_id,
        professional_id=current_user_id,
        event_type='document',
        reference_type='patient_document',
        title=f'Documento subido: {title or original_filename}'
    )
    db.session.add(event)
    db.session.commit()

    event.reference_id = document.id
    db.session.commit()

    return jsonify(document_schema.dump(document)), 201


@blueprint.route('/documents/<int:document_id>/download', methods=['GET'])
@jwt_required()
def download_document(document_id):
    """Download patient document file."""
    document = PatientDocument.query.get(document_id)

    if not document:
        return jsonify({'msg': 'Document not found'}), 404
    if not _has_patient_access(document.patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    if not document.file_path or not os.path.exists(document.file_path):
        return jsonify({'msg': 'File not found on disk'}), 404

    return send_file(
        document.file_path,
        as_attachment=True,
        download_name=document.file_name or 'document',
        mimetype=document.mime_type or 'application/octet-stream'
    )


# ==================== PRESCRIPTIONS ====================

@blueprint.route('/prescriptions', methods=['GET'])
@jwt_required()
def list_prescriptions():
    """List prescriptions"""
    try:
        prescriptions = PrescriptionService.list_prescriptions(
            current_user_id=get_jwt_identity(),
            patient_id=request.args.get('patient_id', type=int),
            treatment_id=request.args.get('treatment_id', type=int),
            include_annulled=request.args.get('include_annulled', 'false').lower() == 'true',
        )
        return jsonify(prescriptions_schema.dump(prescriptions)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/prescriptions', methods=['POST'])
@jwt_required()
def create_prescription():
    """Create prescription"""
    try:
        prescription = PrescriptionService.create_prescription(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(prescription_schema.dump(prescription)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/prescriptions/<int:prescription_id>/annul', methods=['POST'])
@jwt_required()
def annul_prescription(prescription_id):
    """Annul prescription"""
    try:
        prescription = PrescriptionService.annul_prescription(
            current_user_id=get_jwt_identity(),
            prescription_id=prescription_id,
        )
        return jsonify(prescription_schema.dump(prescription)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


# ==================== CLINICAL DOCUMENTS ====================

@blueprint.route('/clinical-docs', methods=['GET'])
@jwt_required()
def list_clinical_docs():
    """List clinical documents"""
    patient_id = request.args.get('patient_id', type=int)
    document_type = request.args.get('document_type')
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

    if not patient_id:
        return jsonify({'msg': 'patient_id is required'}), 400
    if not _has_patient_access(patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    query = ClinicalDocument.query.filter_by(patient_id=patient_id)

    if document_type:
        query = query.filter_by(document_type=document_type)
    if not include_inactive:
        query = query.filter_by(is_active=True)

    docs = query.order_by(ClinicalDocument.created_at.desc()).all()
    return jsonify(clinical_docs_schema.dump(docs)), 200


@blueprint.route('/clinical-docs', methods=['POST'])
@jwt_required()
def create_clinical_doc():
    """Create clinical document"""
    data = request.get_json() or {}

    required_fields = ['patient_id', 'document_type', 'title']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({'msg': 'Missing required fields', 'missing_fields': missing_fields}), 400

    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404
    if not _has_patient_access(data['patient_id']):
        return jsonify({'msg': 'Unauthorized'}), 403

    doc = ClinicalDocument(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        document_type=data['document_type'],
        title=data['title'],
        content=data.get('content'),
        template_id=data.get('template_id')
    )
    db.session.add(doc)
    db.session.commit()

    return jsonify(clinical_doc_schema.dump(doc)), 201


@blueprint.route('/clinical-docs/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_clinical_doc(doc_id):
    """Soft delete clinical document"""
    doc = ClinicalDocument.query.get(doc_id)
    if not doc:
        return jsonify({'msg': 'Document not found'}), 404
    if not _has_patient_access(doc.patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    doc.is_active = False
    db.session.commit()
    return jsonify({'msg': 'Document deleted successfully'}), 200


# ==================== INFORMED CONSENTS ====================

@blueprint.route('/consents', methods=['GET'])
@jwt_required()
def list_consents():
    """List informed consents"""
    patient_id = request.args.get('patient_id', type=int)
    status = request.args.get('status')

    if not patient_id:
        return jsonify({'msg': 'patient_id is required'}), 400
    if not _has_patient_access(patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    query = InformedConsent.query.filter_by(patient_id=patient_id)

    if status:
        query = query.filter_by(status=status)

    consents = query.order_by(InformedConsent.created_at.desc()).all()
    return jsonify(consents_schema.dump(consents)), 200


@blueprint.route('/consents', methods=['POST'])
@jwt_required()
def create_consent():
    """Create informed consent"""
    data = request.get_json() or {}

    required_fields = ['patient_id', 'consent_type', 'title']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({'msg': 'Missing required fields', 'missing_fields': missing_fields}), 400

    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404
    if not _has_patient_access(data['patient_id']):
        return jsonify({'msg': 'Unauthorized'}), 403

    consent = InformedConsent(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        treatment_id=data.get('treatment_id'),
        consent_type=data['consent_type'],
        title=data['title'],
        content=data.get('content'),
        status='pending'
    )
    db.session.add(consent)

    # Create timeline event
    event = ClinicalHistoryEvent(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        event_type='consent',
        reference_type='informed_consent',
        title=f'Consentimiento creado: {data["title"]}'
    )
    db.session.add(event)
    db.session.commit()

    event.reference_id = consent.id
    db.session.commit()

    return jsonify(consent_schema.dump(consent)), 201


@blueprint.route('/consents/<int:consent_id>/sign', methods=['POST'])
@jwt_required()
def sign_consent(consent_id):
    """Sign informed consent"""
    consent = InformedConsent.query.get(consent_id)
    if not consent:
        return jsonify({'msg': 'Consent not found'}), 404
    if not _has_patient_access(consent.patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    if consent.status != 'pending':
        return jsonify({'msg': 'Consent is not pending'}), 400

    data = request.get_json() or {}

    if 'patient_signature' not in data:
        return jsonify({'msg': 'patient_signature is required'}), 400

    consent.patient_signature = data['patient_signature']
    consent.patient_signed_at = datetime.utcnow()

    # Guardian signature if provided
    if data.get('guardian_signature'):
        consent.guardian_name = data.get('guardian_name')
        consent.guardian_relationship = data.get('guardian_relationship')
        consent.guardian_signature = data['guardian_signature']
        consent.guardian_signed_at = datetime.utcnow()

    consent.status = 'signed'
    db.session.commit()

    return jsonify(consent_schema.dump(consent)), 200


@blueprint.route('/consents/<int:consent_id>/reject', methods=['POST'])
@jwt_required()
def reject_consent(consent_id):
    """Reject informed consent"""
    consent = InformedConsent.query.get(consent_id)
    if not consent:
        return jsonify({'msg': 'Consent not found'}), 404
    if not _has_patient_access(consent.patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    if consent.status != 'pending':
        return jsonify({'msg': 'Consent is not pending'}), 400

    data = request.get_json() or {}

    consent.status = 'rejected'
    consent.rejected_reason = data.get('reason')
    db.session.commit()

    return jsonify(consent_schema.dump(consent)), 200


# ==================== TIMELINE EVENTS ====================

@blueprint.route('/timeline', methods=['GET'])
@jwt_required()
def get_timeline():
    """Get patient clinical history timeline"""
    patient_id = request.args.get('patient_id', type=int)
    event_type = request.args.get('event_type')
    limit = request.args.get('limit', 50, type=int)

    if not patient_id:
        return jsonify({'msg': 'patient_id is required'}), 400
    if not _has_patient_access(patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    query = ClinicalHistoryEvent.query.filter_by(patient_id=patient_id, is_active=True)

    if event_type:
        query = query.filter_by(event_type=event_type)

    events = query.order_by(ClinicalHistoryEvent.event_date.desc()).limit(limit).all()
    return jsonify(events_schema.dump(events)), 200


@blueprint.route('/timeline', methods=['POST'])
@jwt_required()
def create_timeline_event():
    """Create manual timeline event (note, alert)"""
    data = request.get_json() or {}

    required_fields = ['patient_id', 'event_type', 'title']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({'msg': 'Missing required fields', 'missing_fields': missing_fields}), 400

    # Only allow manual event types
    if data['event_type'] not in ['note', 'alert']:
        return jsonify({'msg': 'event_type must be note or alert for manual events'}), 400

    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404
    if not _has_patient_access(data['patient_id']):
        return jsonify({'msg': 'Unauthorized'}), 403

    event = ClinicalHistoryEvent(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        event_type=data['event_type'],
        title=data['title'],
        description=data.get('description'),
        is_important=data.get('is_important', data['event_type'] == 'alert')
    )
    db.session.add(event)
    db.session.commit()

    return jsonify(event_schema.dump(event)), 201


# ==================== SUMMARY ====================

@blueprint.route('/summary/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_summary(patient_id):
    """Get clinical history summary for a patient"""
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404
    if not _has_patient_access(patient_id):
        return jsonify({'msg': 'Unauthorized'}), 403

    # Count records
    evolutions_count = Evolution.query.filter_by(patient_id=patient_id).filter(Evolution.status != 'annulled').count()
    prescriptions_count = Prescription.query.filter_by(patient_id=patient_id).filter(Prescription.status != 'annulled').count()
    documents_count = PatientDocument.query.filter_by(patient_id=patient_id, is_active=True).count()
    clinical_docs_count = ClinicalDocument.query.filter_by(patient_id=patient_id, is_active=True).count()
    consents_pending = InformedConsent.query.filter_by(patient_id=patient_id, status='pending').count()
    consents_signed = InformedConsent.query.filter_by(patient_id=patient_id, status='signed').count()

    # Get anamnesis
    anamnesis = Anamnesis.query.filter_by(patient_id=patient_id, is_active=True).first()

    # Get recent events
    recent_events = ClinicalHistoryEvent.query.filter_by(
        patient_id=patient_id, is_active=True
    ).order_by(ClinicalHistoryEvent.event_date.desc()).limit(5).all()

    return jsonify({
        'patient_id': patient_id,
        'has_anamnesis': anamnesis is not None,
        'medical_alerts': anamnesis.medical_alerts if anamnesis else [],
        'counts': {
            'evolutions': evolutions_count,
            'prescriptions': prescriptions_count,
            'documents': documents_count,
            'clinical_documents': clinical_docs_count,
            'consents_pending': consents_pending,
            'consents_signed': consents_signed
        },
        'recent_events': events_schema.dump(recent_events)
    }), 200
