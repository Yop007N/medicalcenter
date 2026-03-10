# -*- coding: utf-8 -*-
"""
Clinical History CRUD endpoints
"""

import os
from app.resources.domain_errors import domain_error_response
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.schemas.clinical_history_schema import (
    EvolutionSchema, AnamnesisSchema, PeriodontalRecordSchema,
    PatientDocumentSchema, PrescriptionSchema, ClinicalDocumentSchema,
    InformedConsentSchema, ClinicalHistoryEventSchema
)
from app.services.clinical_history_service import (
    AnamnesisService,
    ClinicalDocumentService,
    ConsentService,
    EvolutionService,
    PatientDocumentService,
    PeriodontalRecordService,
    PrescriptionService,
    TimelineService,
)
from app.services.exceptions import (
    AccessDeniedError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)

# File upload configuration
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'storage/clinical_documents')

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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


# ==================== PATIENT DOCUMENTS ====================

@blueprint.route('/documents', methods=['GET'])
@jwt_required()
def list_documents():
    """List patient documents"""
    try:
        documents = PatientDocumentService.list_documents(
            current_user_id=get_jwt_identity(),
            patient_id=request.args.get('patient_id', type=int),
            document_type=request.args.get('document_type'),
            include_inactive=request.args.get('include_inactive', 'false').lower() == 'true',
        )
        return jsonify(documents_schema.dump(documents)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/documents', methods=['POST'])
@jwt_required()
def create_document():
    """Create patient document"""
    try:
        document = PatientDocumentService.create_document(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(document_schema.dump(document)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/documents/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    """Soft delete patient document"""
    try:
        PatientDocumentService.delete_document(
            current_user_id=get_jwt_identity(),
            document_id=document_id,
        )
        return jsonify({'msg': 'Document deleted successfully'}), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


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
    try:
        document = PatientDocumentService.upload_document(
            current_user_id=get_jwt_identity(),
            file_obj=request.files.get('file'),
            form_data=request.form,
            upload_folder=UPLOAD_FOLDER,
        )
        return jsonify(document_schema.dump(document)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/documents/<int:document_id>/download', methods=['GET'])
@jwt_required()
def download_document(document_id):
    """Download patient document file."""
    try:
        payload = PatientDocumentService.get_download_payload(
            current_user_id=get_jwt_identity(),
            document_id=document_id,
        )
        return send_file(
            payload['file_path'],
            as_attachment=True,
            download_name=payload['download_name'],
            mimetype=payload['mimetype'],
        )
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


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
        return domain_error_response(error)


# ==================== CLINICAL DOCUMENTS ====================

@blueprint.route('/clinical-docs', methods=['GET'])
@jwt_required()
def list_clinical_docs():
    """List clinical documents"""
    try:
        docs = ClinicalDocumentService.list_documents(
            current_user_id=get_jwt_identity(),
            patient_id=request.args.get('patient_id', type=int),
            document_type=request.args.get('document_type'),
            include_inactive=request.args.get('include_inactive', 'false').lower() == 'true',
        )
        return jsonify(clinical_docs_schema.dump(docs)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/clinical-docs', methods=['POST'])
@jwt_required()
def create_clinical_doc():
    """Create clinical document"""
    try:
        doc = ClinicalDocumentService.create_document(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(clinical_doc_schema.dump(doc)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/clinical-docs/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_clinical_doc(doc_id):
    """Soft delete clinical document"""
    try:
        ClinicalDocumentService.delete_document(
            current_user_id=get_jwt_identity(),
            doc_id=doc_id,
        )
        return jsonify({'msg': 'Document deleted successfully'}), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


# ==================== INFORMED CONSENTS ====================

@blueprint.route('/consents', methods=['GET'])
@jwt_required()
def list_consents():
    """List informed consents"""
    try:
        consents = ConsentService.list_consents(
            current_user_id=get_jwt_identity(),
            patient_id=request.args.get('patient_id', type=int),
            status=request.args.get('status'),
        )
        return jsonify(consents_schema.dump(consents)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/consents', methods=['POST'])
@jwt_required()
def create_consent():
    """Create informed consent"""
    try:
        consent = ConsentService.create_consent(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(consent_schema.dump(consent)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/consents/<int:consent_id>/sign', methods=['POST'])
@jwt_required()
def sign_consent(consent_id):
    """Sign informed consent"""
    try:
        consent = ConsentService.sign_consent(
            current_user_id=get_jwt_identity(),
            consent_id=consent_id,
            data=request.get_json() or {},
        )
        return jsonify(consent_schema.dump(consent)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/consents/<int:consent_id>/reject', methods=['POST'])
@jwt_required()
def reject_consent(consent_id):
    """Reject informed consent"""
    try:
        consent = ConsentService.reject_consent(
            current_user_id=get_jwt_identity(),
            consent_id=consent_id,
            data=request.get_json() or {},
        )
        return jsonify(consent_schema.dump(consent)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


# ==================== TIMELINE EVENTS ====================

@blueprint.route('/timeline', methods=['GET'])
@jwt_required()
def get_timeline():
    """Get patient clinical history timeline"""
    try:
        events = TimelineService.list_events(
            current_user_id=get_jwt_identity(),
            patient_id=request.args.get('patient_id', type=int),
            event_type=request.args.get('event_type'),
            limit=request.args.get('limit', 50, type=int),
        )
        return jsonify(events_schema.dump(events)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/timeline', methods=['POST'])
@jwt_required()
def create_timeline_event():
    """Create manual timeline event (note, alert)"""
    try:
        event = TimelineService.create_manual_event(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(event_schema.dump(event)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)


# ==================== SUMMARY ====================

@blueprint.route('/summary/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_summary(patient_id):
    """Get clinical history summary for a patient"""
    try:
        summary = TimelineService.get_summary(
            current_user_id=get_jwt_identity(),
            patient_id=patient_id,
        )
        return jsonify({
            'patient_id': summary['patient_id'],
            'has_anamnesis': summary['has_anamnesis'],
            'medical_alerts': summary['medical_alerts'],
            'counts': summary['counts'],
            'recent_events': events_schema.dump(summary['recent_events']),
        }), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as error:
        return domain_error_response(error)
