# -*- coding: utf-8 -*-
"""
Clinical History Models - Odontology clinical history components
"""

from app.extensions import db
from datetime import datetime


class Evolution(db.Model):
    """Evoluciones - Treatment evolutions/progress notes"""
    __tablename__ = 'evolutions'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)
    treatment_plan_id = db.Column(db.Integer, db.ForeignKey('dental_treatments.id'))

    # Evolution details
    action_performed = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text)

    # Status: pending, signed, annulled
    status = db.Column(db.String(50), default='pending')

    # Digital signatures
    professional_signature = db.Column(db.Text)  # Base64 encoded signature image
    professional_signed_at = db.Column(db.DateTime)
    patient_signature = db.Column(db.Text)  # Base64 encoded signature image
    patient_signed_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='evolutions')
    professional = db.relationship('Professional', backref='evolutions')
    treatment_plan = db.relationship('DentalTreatment', backref='evolutions')

    def __repr__(self):
        return f'<Evolution {self.id} - Patient {self.patient_id}>'


class Anamnesis(db.Model):
    """Anamnesis - Patient medical history form"""
    __tablename__ = 'anamnesis'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False, unique=True)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'))

    # Consultation reason
    consultation_reason = db.Column(db.String(200))

    # Medical alerts (JSON array of conditions)
    medical_alerts = db.Column(db.JSON)  # e.g., ["hypertension", "diabetes"]

    # Current medications (JSON array)
    current_medications = db.Column(db.JSON)  # e.g., ["aspirin", "metformin"]

    # Habits (JSON object)
    habits = db.Column(db.JSON)  # e.g., {"smoking": true, "alcohol": false}

    # Allergies
    allergies = db.Column(db.Text)

    # Other medical conditions
    other_conditions = db.Column(db.Text)

    # Pregnancy (for female patients)
    is_pregnant = db.Column(db.Boolean, default=False)
    pregnancy_weeks = db.Column(db.Integer)

    # Last dental visit
    last_dental_visit = db.Column(db.Date)

    # Notes
    notes = db.Column(db.Text)

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='anamnesis')
    professional = db.relationship('Professional', backref='anamnesis_records')

    def __repr__(self):
        return f'<Anamnesis {self.id} - Patient {self.patient_id}>'


class PeriodontalRecord(db.Model):
    """Periodontograma - Periodontal measurements per tooth"""
    __tablename__ = 'periodontal_records'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)
    odontogram_id = db.Column(db.Integer, db.ForeignKey('odontograms.id'))

    # Date of measurement
    measurement_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)

    # Tooth number (FDI notation)
    tooth_number = db.Column(db.Integer, nullable=False)

    # Probing depths (6 points per tooth: mesial-buccal, buccal, distal-buccal, mesial-lingual, lingual, distal-lingual)
    probing_depth_mb = db.Column(db.Integer)  # Mesial-buccal
    probing_depth_b = db.Column(db.Integer)   # Buccal
    probing_depth_db = db.Column(db.Integer)  # Distal-buccal
    probing_depth_ml = db.Column(db.Integer)  # Mesial-lingual
    probing_depth_l = db.Column(db.Integer)   # Lingual
    probing_depth_dl = db.Column(db.Integer)  # Distal-lingual

    # Gingival margin (6 points)
    margin_mb = db.Column(db.Integer)
    margin_b = db.Column(db.Integer)
    margin_db = db.Column(db.Integer)
    margin_ml = db.Column(db.Integer)
    margin_l = db.Column(db.Integer)
    margin_dl = db.Column(db.Integer)

    # Clinical Attachment Level (calculated from probing depth + margin)
    # Can be calculated or stored

    # Furcation involvement (for multi-rooted teeth): 0, I, II, III
    furcation = db.Column(db.String(10))

    # Mobility: 0, 1, 2, 3
    mobility = db.Column(db.Integer)

    # Bleeding on probing
    bleeding = db.Column(db.Boolean, default=False)

    # Plaque present
    plaque = db.Column(db.Boolean, default=False)

    # Suppuration
    suppuration = db.Column(db.Boolean, default=False)

    notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='periodontal_records')
    professional = db.relationship('Professional', backref='periodontal_records')
    odontogram = db.relationship('Odontogram', backref='periodontal_records')

    __table_args__ = (
        db.UniqueConstraint('patient_id', 'measurement_date', 'tooth_number',
                           name='unique_periodontal_per_tooth_date'),
    )

    def __repr__(self):
        return f'<PeriodontalRecord Tooth {self.tooth_number} - Patient {self.patient_id}>'


class PatientDocument(db.Model):
    """Patient documents - X-rays, photos, and other documents"""
    __tablename__ = 'patient_documents'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'))
    file_id = db.Column(db.Integer, db.ForeignKey('files.id'))

    # Document classification
    document_type = db.Column(db.String(50), nullable=False)
    # Types: xray_panoramic, xray_periapical, xray_bitewing, photo_intraoral, photo_extraoral,
    #        ct_scan, mri, lab_result, referral, radiograph, other

    title = db.Column(db.String(200))
    description = db.Column(db.Text)

    # File information (for direct file storage without using files table)
    file_name = db.Column(db.String(255))
    file_path = db.Column(db.String(500))
    mime_type = db.Column(db.String(100))
    file_size = db.Column(db.Integer)  # Size in bytes

    # Affected teeth (optional)
    affected_teeth = db.Column(db.JSON)  # Array of tooth numbers

    # Document date
    document_date = db.Column(db.Date)

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='patient_documents')
    professional = db.relationship('Professional', backref='uploaded_documents')
    file = db.relationship('File', backref='patient_document')

    def __repr__(self):
        return f'<PatientDocument {self.document_type} - Patient {self.patient_id}>'


class Prescription(db.Model):
    """Recetas - Medical prescriptions"""
    __tablename__ = 'prescriptions'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)
    treatment_id = db.Column(db.Integer, db.ForeignKey('dental_treatments.id'))

    # Prescription content (HTML or plain text)
    content = db.Column(db.Text, nullable=False)

    # Prescription date
    prescription_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Status: active, annulled
    status = db.Column(db.String(50), default='active')

    # Digital signature
    professional_signature = db.Column(db.Text)  # Base64 encoded signature

    notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='prescriptions')
    professional = db.relationship('Professional', backref='prescriptions')
    treatment = db.relationship('DentalTreatment', backref='prescriptions')

    def __repr__(self):
        return f'<Prescription {self.id} - Patient {self.patient_id}>'


class ClinicalDocument(db.Model):
    """Documentos Clínicos - Clinical documents (reports, certificates, etc.)"""
    __tablename__ = 'clinical_documents'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)

    # Document type
    document_type = db.Column(db.String(50), nullable=False)
    # Types: medical_certificate, referral, treatment_report, clinical_summary,
    #        discharge_summary, fitness_certificate, other

    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text)

    # Template used (if any)
    template_id = db.Column(db.Integer)

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='clinical_documents')
    professional = db.relationship('Professional', backref='clinical_documents')

    def __repr__(self):
        return f'<ClinicalDocument {self.document_type} - Patient {self.patient_id}>'


class InformedConsent(db.Model):
    """Consentimientos Informados - Informed consent forms"""
    __tablename__ = 'informed_consents'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)
    treatment_id = db.Column(db.Integer, db.ForeignKey('dental_treatments.id'))

    # Consent type
    consent_type = db.Column(db.String(100), nullable=False)
    # Types: general_treatment, extraction, root_canal, surgery, implant,
    #        orthodontics, sedation, anesthesia, radiography, other

    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text)  # Full consent text

    # Status: pending, signed, rejected, annulled
    status = db.Column(db.String(50), default='pending')

    # Patient signature
    patient_signature = db.Column(db.Text)  # Base64 encoded signature
    patient_signed_at = db.Column(db.DateTime)

    # Guardian signature (for minors)
    guardian_name = db.Column(db.String(200))
    guardian_relationship = db.Column(db.String(100))
    guardian_signature = db.Column(db.Text)
    guardian_signed_at = db.Column(db.DateTime)

    # Professional witness
    witness_professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'))

    # Rejection reason (if rejected)
    rejected_reason = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='informed_consents')
    professional = db.relationship('Professional', foreign_keys=[professional_id], backref='created_consents')
    witness = db.relationship('Professional', foreign_keys=[witness_professional_id], backref='witnessed_consents')
    treatment = db.relationship('DentalTreatment', backref='informed_consents')

    def __repr__(self):
        return f'<InformedConsent {self.consent_type} - Patient {self.patient_id}>'


class ClinicalHistoryEvent(db.Model):
    """Timeline events for clinical history"""
    __tablename__ = 'clinical_history_events'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'))

    # Event type
    event_type = db.Column(db.String(50), nullable=False)
    # Types: appointment, evolution, prescription, document, consent,
    #        treatment_start, treatment_end, note, alert

    # Reference to related entity
    reference_type = db.Column(db.String(50))  # e.g., 'evolution', 'prescription'
    reference_id = db.Column(db.Integer)

    # Event details
    title = db.Column(db.String(200))
    description = db.Column(db.Text)

    # Event date
    event_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Visibility
    is_important = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='clinical_history_events')
    professional = db.relationship('Professional', backref='clinical_history_events')

    def __repr__(self):
        return f'<ClinicalHistoryEvent {self.event_type} - Patient {self.patient_id}>'
