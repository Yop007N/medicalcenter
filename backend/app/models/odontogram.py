# -*- coding: utf-8 -*-
"""
Odontology Models - Odontogram and Dental Treatments
"""

from app.extensions import db
from datetime import datetime


class Odontogram(db.Model):
    """Odontograma - Dental chart mapping patient's teeth status"""
    __tablename__ = 'odontograms'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)

    # Metadata
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)  # Solo un odontograma activo por paciente

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='odontograms')
    professional = db.relationship('Professional', backref='odontograms')
    teeth = db.relationship('Tooth', backref='odontogram', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Odontogram {self.id} - Patient {self.patient_id}>'


class Tooth(db.Model):
    """Individual tooth record with surface-level detail"""
    __tablename__ = 'teeth'

    id = db.Column(db.Integer, primary_key=True)
    odontogram_id = db.Column(db.Integer, db.ForeignKey('odontograms.id'), nullable=False)

    # FDI World Dental Federation notation (11-48 for adults, 51-85 for children)
    tooth_number = db.Column(db.Integer, nullable=False)

    # Tooth type for validation
    tooth_type = db.Column(db.String(20))  # permanent, deciduous (temporal)

    # Overall tooth status
    status = db.Column(db.String(50), default='healthy')
    # Options: healthy, caries, filled, crown, implant, missing, root_canal,
    #          fractured, mobile, to_extract, extracted

    # Surface-specific conditions (5 surfaces per tooth)
    mesial = db.Column(db.String(50))       # Mesial surface
    distal = db.Column(db.String(50))       # Distal surface
    oclusal = db.Column(db.String(50))      # Occlusal/Incisal surface
    vestibular = db.Column(db.String(50))   # Vestibular/Buccal surface
    lingual = db.Column(db.String(50))      # Lingual/Palatal surface

    # Surface conditions: healthy, caries, filled, composite, amalgam, etc.

    # Clinical observations
    notes = db.Column(db.Text)
    sensitivity = db.Column(db.String(50))  # none, mild, moderate, severe
    mobility = db.Column(db.Integer)         # Grade 0-3

    # Periodontal status
    gingival_status = db.Column(db.String(50))  # healthy, gingivitis, periodontitis
    pocket_depth = db.Column(db.Integer)         # mm

    # Treatment planning
    planned_treatment = db.Column(db.String(200))
    treatment_priority = db.Column(db.String(20))  # urgent, high, medium, low

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('odontogram_id', 'tooth_number', name='unique_tooth_per_odontogram'),
    )

    def __repr__(self):
        return f'<Tooth {self.tooth_number} - Status: {self.status}>'


class DentalTreatment(db.Model):
    """Specific dental treatment record"""
    __tablename__ = 'dental_treatments'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)
    medical_record_id = db.Column(db.Integer, db.ForeignKey('medical_records.id'))
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'))

    # Treatment identification
    treatment_code = db.Column(db.String(50))  # Código interno o de obra social
    treatment_type = db.Column(db.String(100), nullable=False)
    # Types: filling, root_canal, extraction, cleaning, crown, implant,
    #        orthodontics, whitening, veneer, bridge, denture, etc.

    # Affected teeth (can be multiple)
    affected_teeth = db.Column(db.JSON)  # Array: [11, 12, 21] using FDI notation

    # Treatment details
    description = db.Column(db.Text)
    materials_used = db.Column(db.JSON)  # Array: ["composite", "local_anesthesia"]
    technique = db.Column(db.String(200))  # Specific technique used

    # Anesthesia
    anesthesia_type = db.Column(db.String(100))  # local, general, sedation, none
    anesthesia_details = db.Column(db.String(200))

    # Dates and duration
    treatment_date = db.Column(db.Date, nullable=False)
    duration_minutes = db.Column(db.Integer)
    sessions_required = db.Column(db.Integer, default=1)  # Total sessions needed
    session_number = db.Column(db.Integer, default=1)     # Current session

    # Status tracking
    status = db.Column(db.String(50), default='planned')
    # planned, in_progress, completed, cancelled, postponed

    completion_date = db.Column(db.Date)
    next_appointment = db.Column(db.Date)  # Follow-up date

    # Financial
    estimated_cost = db.Column(db.Numeric(10, 2))
    final_cost = db.Column(db.Numeric(10, 2))
    insurance_covered = db.Column(db.Numeric(10, 2))  # Monto cubierto por obra social
    patient_payment = db.Column(db.Numeric(10, 2))    # Pago del paciente

    # Clinical notes
    pre_treatment_notes = db.Column(db.Text)   # Notas antes del tratamiento
    post_treatment_notes = db.Column(db.Text)  # Notas después del tratamiento
    complications = db.Column(db.Text)          # Complicaciones durante tratamiento

    # Post-treatment instructions
    care_instructions = db.Column(db.Text)  # Instrucciones de cuidado post-tratamiento
    medications_prescribed = db.Column(db.JSON)  # Medicamentos recetados

    # Quality metrics
    patient_satisfaction = db.Column(db.Integer)  # 1-5 rating
    treatment_success = db.Column(db.Boolean)      # True if successful

    # Follow-up
    requires_followup = db.Column(db.Boolean, default=False)
    followup_date = db.Column(db.Date)
    followup_notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='dental_treatments')
    professional = db.relationship('Professional', backref='dental_treatments')
    medical_record = db.relationship('MedicalRecord', backref='dental_treatments')
    appointment = db.relationship('Appointment', backref='dental_treatments')

    def __repr__(self):
        return f'<DentalTreatment {self.treatment_type} - Patient {self.patient_id}>'
