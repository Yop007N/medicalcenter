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


# ==================== EVOLUTIONS ====================

@blueprint.route('/evolutions', methods=['GET'])
@jwt_required()
def list_evolutions():
    """List evolutions with optional filters"""
    patient_id = request.args.get('patient_id', type=int)
    status = request.args.get('status')
    include_annulled = request.args.get('include_annulled', 'false').lower() == 'true'

    query = Evolution.query

    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if status:
        query = query.filter_by(status=status)
    if not include_annulled:
        query = query.filter(Evolution.status != 'annulled')

    evolutions = query.order_by(Evolution.created_at.desc()).all()
    return jsonify(evolutions_schema.dump(evolutions)), 200


@blueprint.route('/evolutions', methods=['POST'])
@jwt_required()
def create_evolution():
    """Create new evolution"""
    data = request.get_json() or {}

    required_fields = ['patient_id', 'action_performed']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({'msg': 'Missing required fields', 'missing_fields': missing_fields}), 400

    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    evolution = Evolution(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        treatment_plan_id=data.get('treatment_plan_id'),
        action_performed=data['action_performed'],
        notes=data.get('notes'),
        status=data.get('status', 'pending')
    )
    db.session.add(evolution)

    # Create timeline event
    event = ClinicalHistoryEvent(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        event_type='evolution',
        reference_type='evolution',
        title='Nueva evolución registrada',
        description=data['action_performed'][:200] if data['action_performed'] else None
    )
    db.session.add(event)
    db.session.commit()

    event.reference_id = evolution.id
    db.session.commit()

    return jsonify(evolution_schema.dump(evolution)), 201


@blueprint.route('/evolutions/<int:evolution_id>', methods=['GET'])
@jwt_required()
def get_evolution(evolution_id):
    """Get evolution by ID"""
    evolution = Evolution.query.get(evolution_id)
    if not evolution:
        return jsonify({'msg': 'Evolution not found'}), 404
    return jsonify(evolution_schema.dump(evolution)), 200


@blueprint.route('/evolutions/<int:evolution_id>', methods=['PUT'])
@jwt_required()
def update_evolution(evolution_id):
    """Update evolution"""
    evolution = Evolution.query.get(evolution_id)
    if not evolution:
        return jsonify({'msg': 'Evolution not found'}), 404

    if evolution.status == 'annulled':
        return jsonify({'msg': 'Cannot modify annulled evolution'}), 400

    data = request.get_json() or {}

    if 'action_performed' in data:
        evolution.action_performed = data['action_performed']
    if 'notes' in data:
        evolution.notes = data['notes']
    if 'treatment_plan_id' in data:
        evolution.treatment_plan_id = data['treatment_plan_id']

    db.session.commit()
    return jsonify(evolution_schema.dump(evolution)), 200


@blueprint.route('/evolutions/<int:evolution_id>/sign', methods=['POST'])
@jwt_required()
def sign_evolution(evolution_id):
    """Sign evolution (professional or patient)"""
    evolution = Evolution.query.get(evolution_id)
    if not evolution:
        return jsonify({'msg': 'Evolution not found'}), 404

    data = request.get_json() or {}
    signer_type = data.get('signer_type')  # 'professional' or 'patient'
    signature = data.get('signature')

    if not signer_type or not signature:
        return jsonify({'msg': 'signer_type and signature are required'}), 400

    if signer_type == 'professional':
        evolution.professional_signature = signature
        evolution.professional_signed_at = datetime.utcnow()
    elif signer_type == 'patient':
        evolution.patient_signature = signature
        evolution.patient_signed_at = datetime.utcnow()
    else:
        return jsonify({'msg': 'signer_type must be professional or patient'}), 400

    # If both signed, update status
    if evolution.professional_signature and evolution.patient_signature:
        evolution.status = 'signed'

    db.session.commit()
    return jsonify(evolution_schema.dump(evolution)), 200


@blueprint.route('/evolutions/<int:evolution_id>/annul', methods=['POST'])
@jwt_required()
def annul_evolution(evolution_id):
    """Annul evolution"""
    evolution = Evolution.query.get(evolution_id)
    if not evolution:
        return jsonify({'msg': 'Evolution not found'}), 404

    evolution.status = 'annulled'
    db.session.commit()
    return jsonify(evolution_schema.dump(evolution)), 200


# ==================== ANAMNESIS ====================

@blueprint.route('/anamnesis/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_anamnesis(patient_id):
    """Get anamnesis for a patient"""
    anamnesis = Anamnesis.query.filter_by(patient_id=patient_id, is_active=True).first()
    if not anamnesis:
        return jsonify({'msg': 'Anamnesis not found'}), 404
    return jsonify(anamnesis_schema.dump(anamnesis)), 200


@blueprint.route('/anamnesis', methods=['POST'])
@jwt_required()
def create_or_update_anamnesis():
    """Create or update patient anamnesis"""
    data = request.get_json() or {}

    if 'patient_id' not in data:
        return jsonify({'msg': 'patient_id is required'}), 400

    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    # Check if anamnesis exists
    anamnesis = Anamnesis.query.filter_by(patient_id=data['patient_id']).first()

    if anamnesis:
        # Update existing
        anamnesis.consultation_reason = data.get('consultation_reason', anamnesis.consultation_reason)
        anamnesis.medical_alerts = data.get('medical_alerts', anamnesis.medical_alerts)
        anamnesis.current_medications = data.get('current_medications', anamnesis.current_medications)
        anamnesis.habits = data.get('habits', anamnesis.habits)
        anamnesis.allergies = data.get('allergies', anamnesis.allergies)
        anamnesis.other_conditions = data.get('other_conditions', anamnesis.other_conditions)
        anamnesis.is_pregnant = data.get('is_pregnant', anamnesis.is_pregnant)
        anamnesis.pregnancy_weeks = data.get('pregnancy_weeks', anamnesis.pregnancy_weeks)
        anamnesis.last_dental_visit = data.get('last_dental_visit', anamnesis.last_dental_visit)
        anamnesis.notes = data.get('notes', anamnesis.notes)
        anamnesis.professional_id = get_jwt_identity()
    else:
        # Create new
        anamnesis = Anamnesis(
            patient_id=data['patient_id'],
            professional_id=get_jwt_identity(),
            consultation_reason=data.get('consultation_reason'),
            medical_alerts=data.get('medical_alerts'),
            current_medications=data.get('current_medications'),
            habits=data.get('habits'),
            allergies=data.get('allergies'),
            other_conditions=data.get('other_conditions'),
            is_pregnant=data.get('is_pregnant', False),
            pregnancy_weeks=data.get('pregnancy_weeks'),
            last_dental_visit=data.get('last_dental_visit'),
            notes=data.get('notes')
        )
        db.session.add(anamnesis)

    db.session.commit()
    return jsonify(anamnesis_schema.dump(anamnesis)), 200


# ==================== PERIODONTAL RECORDS ====================

@blueprint.route('/periodontal', methods=['GET'])
@jwt_required()
def list_periodontal_records():
    """List periodontal records with optional filters"""
    patient_id = request.args.get('patient_id', type=int)
    measurement_date = request.args.get('measurement_date')

    if not patient_id:
        return jsonify({'msg': 'patient_id is required'}), 400

    query = PeriodontalRecord.query.filter_by(patient_id=patient_id)

    if measurement_date:
        query = query.filter_by(measurement_date=measurement_date)

    records = query.order_by(PeriodontalRecord.tooth_number).all()
    return jsonify(periodontal_records_schema.dump(records)), 200


@blueprint.route('/periodontal', methods=['POST'])
@jwt_required()
def create_periodontal_record():
    """Create or update periodontal record for a tooth"""
    data = request.get_json() or {}

    required_fields = ['patient_id', 'tooth_number']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({'msg': 'Missing required fields', 'missing_fields': missing_fields}), 400

    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    measurement_date = data.get('measurement_date', datetime.utcnow().date())

    # Check if record exists for this tooth and date
    existing = PeriodontalRecord.query.filter_by(
        patient_id=data['patient_id'],
        tooth_number=data['tooth_number'],
        measurement_date=measurement_date
    ).first()

    if existing:
        record = existing
        # Update all fields
        for field in ['probing_depth_mb', 'probing_depth_b', 'probing_depth_db',
                     'probing_depth_ml', 'probing_depth_l', 'probing_depth_dl',
                     'margin_mb', 'margin_b', 'margin_db', 'margin_ml', 'margin_l', 'margin_dl',
                     'furcation', 'mobility', 'bleeding', 'plaque', 'suppuration', 'notes']:
            if field in data:
                setattr(record, field, data[field])
    else:
        record = PeriodontalRecord(
            patient_id=data['patient_id'],
            professional_id=get_jwt_identity(),
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
            notes=data.get('notes')
        )
        db.session.add(record)

    db.session.commit()
    return jsonify(periodontal_schema.dump(record)), 201


@blueprint.route('/periodontal/bulk', methods=['POST'])
@jwt_required()
def bulk_create_periodontal():
    """Bulk create/update periodontal records"""
    data = request.get_json() or {}

    if 'patient_id' not in data or 'records' not in data:
        return jsonify({'msg': 'patient_id and records are required'}), 400

    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    measurement_date = data.get('measurement_date', datetime.utcnow().date())
    created_records = []

    for record_data in data['records']:
        if 'tooth_number' not in record_data:
            continue

        existing = PeriodontalRecord.query.filter_by(
            patient_id=data['patient_id'],
            tooth_number=record_data['tooth_number'],
            measurement_date=measurement_date
        ).first()

        if existing:
            record = existing
            for field in ['probing_depth_mb', 'probing_depth_b', 'probing_depth_db',
                         'probing_depth_ml', 'probing_depth_l', 'probing_depth_dl',
                         'margin_mb', 'margin_b', 'margin_db', 'margin_ml', 'margin_l', 'margin_dl',
                         'furcation', 'mobility', 'bleeding', 'plaque', 'suppuration', 'notes']:
                if field in record_data:
                    setattr(record, field, record_data[field])
        else:
            record = PeriodontalRecord(
                patient_id=data['patient_id'],
                professional_id=get_jwt_identity(),
                measurement_date=measurement_date,
                tooth_number=record_data['tooth_number']
            )
            for field in ['probing_depth_mb', 'probing_depth_b', 'probing_depth_db',
                         'probing_depth_ml', 'probing_depth_l', 'probing_depth_dl',
                         'margin_mb', 'margin_b', 'margin_db', 'margin_ml', 'margin_l', 'margin_dl',
                         'furcation', 'mobility', 'bleeding', 'plaque', 'suppuration', 'notes']:
                if field in record_data:
                    setattr(record, field, record_data[field])
            db.session.add(record)

        created_records.append(record)

    db.session.commit()
    return jsonify(periodontal_records_schema.dump(created_records)), 201


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
    patient_id = request.args.get('patient_id', type=int)
    treatment_id = request.args.get('treatment_id', type=int)
    include_annulled = request.args.get('include_annulled', 'false').lower() == 'true'

    if not patient_id:
        return jsonify({'msg': 'patient_id is required'}), 400

    query = Prescription.query.filter_by(patient_id=patient_id)

    if treatment_id:
        query = query.filter_by(treatment_id=treatment_id)
    if not include_annulled:
        query = query.filter(Prescription.status != 'annulled')

    prescriptions = query.order_by(Prescription.prescription_date.desc()).all()
    return jsonify(prescriptions_schema.dump(prescriptions)), 200


@blueprint.route('/prescriptions', methods=['POST'])
@jwt_required()
def create_prescription():
    """Create prescription"""
    data = request.get_json() or {}

    required_fields = ['patient_id', 'content']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({'msg': 'Missing required fields', 'missing_fields': missing_fields}), 400

    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    prescription = Prescription(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        treatment_id=data.get('treatment_id'),
        content=data['content'],
        notes=data.get('notes'),
        professional_signature=data.get('professional_signature')
    )
    db.session.add(prescription)

    # Create timeline event
    event = ClinicalHistoryEvent(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        event_type='prescription',
        reference_type='prescription',
        title='Nueva receta creada'
    )
    db.session.add(event)
    db.session.commit()

    event.reference_id = prescription.id
    db.session.commit()

    return jsonify(prescription_schema.dump(prescription)), 201


@blueprint.route('/prescriptions/<int:prescription_id>/annul', methods=['POST'])
@jwt_required()
def annul_prescription(prescription_id):
    """Annul prescription"""
    prescription = Prescription.query.get(prescription_id)
    if not prescription:
        return jsonify({'msg': 'Prescription not found'}), 404

    prescription.status = 'annulled'
    db.session.commit()
    return jsonify(prescription_schema.dump(prescription)), 200


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
