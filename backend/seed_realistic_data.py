#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Populate the database with realistic, role-scoped clinical demo data.

Goals:
- Keep seed idempotent (safe to execute multiple times).
- Provide real-looking operational data in all major modules.
- Remove dependency on frontend hardcoded fixtures.
"""

from __future__ import annotations

import unicodedata
from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path

from app import create_app
from app.extensions import db
from app.models import (
    Anamnesis,
    Appointment,
    Budget,
    ClinicalDocument,
    DentalTreatment,
    File,
    MedicalRecord,
    Odontogram,
    Patient,
    Payment,
    PeriodontalRecord,
    Prescription,
    Professional,
    ProfessionalPatientAssignment,
    PsychologicalEvaluation,
    PsychopedagogicalEvaluation,
    SpecialtyEncounter,
    TherapySession,
    InterventionSession,
    User,
    Tooth,
)
from app.services.file_service import FileService
from app.services.specialty_module_service import SpecialtyModuleService

SEED_TAG = "REALISTIC_DEMO_2026_02"
LEGACY_MODULE_KEYS = {"odontology", "psychology", "psychopedagogy"}

DEFAULT_ADMIN_PASSWORD = "admin123"
DEFAULT_PROFESSIONAL_PASSWORD = "doctor123"
DEFAULT_PATIENT_PASSWORD = "patient123"

PROFESSIONAL_IDENTITIES = [
    ("Alicia", "Benitez"),
    ("Carlos", "Ferreira"),
    ("Marina", "Lopez"),
    ("Ricardo", "Mendez"),
    ("Sofia", "Villalba"),
    ("Diego", "Gonzalez"),
    ("Camila", "Rojas"),
    ("Javier", "Acosta"),
    ("Paola", "Martinez"),
    ("Fernando", "Paredes"),
    ("Lucia", "Fernandez"),
    ("Mateo", "Vera"),
    ("Daniela", "Alarcon"),
    ("Miguel", "Caballero"),
    ("Patricia", "Franco"),
    ("Nicolas", "Coronel"),
    ("Valeria", "Ortiz"),
    ("Gabriel", "Meza"),
    ("Lorena", "Sosa"),
    ("Hector", "Ibarra"),
    ("Milagros", "Riquelme"),
    ("Adrian", "Cardozo"),
    ("Silvia", "Gaona"),
    ("Ramon", "Escobar"),
    ("Noelia", "Lezcano"),
    ("Martin", "Insfran"),
    ("Carla", "Duarte"),
    ("Sebastian", "Ramon"),
]

PATIENT_IDENTITIES = [
    ("Jane", "Smith"),
    ("Janet", "Mendoza"),
    ("Lourdes", "Caballero"),
    ("Rafael", "Britez"),
    ("Marta", "Paredes"),
    ("Hugo", "Villamayor"),
    ("Adriana", "Sanchez"),
    ("Nestor", "Araujo"),
    ("Karina", "Delgado"),
    ("Jorge", "Morel"),
    ("Paula", "Benegas"),
    ("Roberto", "Caceres"),
    ("Elena", "Ayala"),
    ("Fabian", "Alonso"),
    ("Patricia", "Rios"),
    ("Gustavo", "Ledesma"),
    ("Maria", "Maidana"),
    ("Rocio", "Salinas"),
    ("Matias", "Paniagua"),
    ("Nadia", "Nuñez"),
    ("Oscar", "Quintana"),
    ("Rosa", "Aguilera"),
    ("Silvio", "Samaniego"),
    ("Tamara", "Crispino"),
    ("Ulises", "Peralta"),
    ("Vanessa", "Correa"),
    ("Walter", "Silva"),
    ("Ximena", "Montiel"),
    ("Yolanda", "Amarilla"),
    ("Zulma", "Cantero"),
]

BLOOD_TYPES = ["O+", "A+", "B+", "AB+", "O-", "A-"]
ALLERGIES = [
    "Ninguna conocida",
    "Alergia leve a penicilina",
    "Alergia a mariscos",
    "Rinitis alergica estacional",
    "Dermatitis de contacto",
]
MEDICAL_BACKGROUNDS = [
    "Control clinico anual sin internaciones recientes.",
    "Antecedente de hipertension controlada y seguimiento nutricional.",
    "Paciente con antecedente de gastritis cronica, en dieta.",
    "Seguimiento por ansiedad leve con buena adherencia terapeutica.",
    "Control post operatorio sin complicaciones de relevancia.",
]


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    no_accents = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return "".join(ch.lower() if ch.isalnum() else "." for ch in no_accents).strip(".")


class RealisticDataSeeder:
    def __init__(self) -> None:
        self.stats: dict[str, int] = defaultdict(int)
        self.catalog = SpecialtyModuleService.get_catalog()
        self.module_by_key = {item["key"]: item for item in self.catalog}

        self.professionals_by_module: dict[str, Professional] = {}
        self.patients: list[Patient] = []
        self.module_patients: dict[str, list[Patient]] = {}
        self.seed_records: list[MedicalRecord] = []

        self.now = datetime.utcnow().replace(second=0, microsecond=0)
        self.past_anchor = self.now - timedelta(days=70)
        self.future_anchor = self.now + timedelta(days=12)
        self.upload_dir = Path(FileService.resolve_upload_dir())
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def bump(self, key: str, created: bool) -> None:
        suffix = "created" if created else "updated"
        self.stats[f"{key}_{suffix}"] += 1

    def run(self) -> None:
        self.seed_core_accounts()
        self.seed_professionals()
        self.seed_patients()
        self.seed_assignments()
        self.seed_operational_flow()
        self.seed_specialty_encounters()
        self.seed_odontology_flow()
        self.seed_psychology_flow()
        self.seed_psychopedagogy_flow()
        self.seed_files()
        db.session.commit()
        self.print_summary()

    def seed_core_accounts(self) -> None:
        admin = User.query.filter_by(email="admin@medical.com").first()
        created = False
        if not admin:
            admin = User(
                email="admin@medical.com",
                first_name="Admin",
                last_name="Medical",
                role="admin",
                is_active=True,
            )
            created = True
            db.session.add(admin)
        admin.first_name = "Admin"
        admin.last_name = "Medical"
        admin.role = "admin"
        admin.is_active = True
        admin.set_password(DEFAULT_ADMIN_PASSWORD)
        self.bump("admin_account", created)

        doctor = Professional.query.filter_by(email="doctor@medical.com").first()
        doctor_created = False
        if not doctor:
            doctor = Professional(
                email="doctor@medical.com",
                role="professional",
                is_active=True,
                license_number="MED-12345",
            )
            doctor_created = True
            db.session.add(doctor)
        doctor.first_name = "John"
        doctor.last_name = "Doe"
        doctor.specialty = "Medicina General"
        doctor.phone = "+595981200100"
        doctor.address = "Av. San Martin 1400, Asuncion"
        doctor.is_active = True
        doctor.set_password(DEFAULT_PROFESSIONAL_PASSWORD)
        self.bump("doctor_account", doctor_created)

        sample_patient = Patient.query.filter_by(email="patient@medical.com").first()
        patient_created = False
        if not sample_patient:
            sample_patient = Patient(
                email="patient@medical.com",
                role="patient",
                is_active=True,
            )
            patient_created = True
            db.session.add(sample_patient)
        sample_patient.first_name = "Jane"
        sample_patient.last_name = "Smith"
        sample_patient.phone = "+595981200999"
        sample_patient.address = "Barrio Recoleta, Asuncion"
        sample_patient.emergency_contact = "Carlos Smith"
        sample_patient.emergency_phone = "+595981201111"
        sample_patient.blood_type = "O+"
        sample_patient.allergies = "Ninguna conocida"
        sample_patient.medical_history = "Control preventivo anual."
        sample_patient.date_of_birth = date(1996, 4, 10)
        sample_patient.is_active = True
        sample_patient.set_password(DEFAULT_PATIENT_PASSWORD)
        self.bump("patient_account", patient_created)

        db.session.flush()

    def seed_professionals(self) -> None:
        for idx, module in enumerate(self.catalog):
            first_name, last_name = PROFESSIONAL_IDENTITIES[idx % len(PROFESSIONAL_IDENTITIES)]
            local_part = normalize_text(module["key"]).replace(".", "")
            email = f"dr.{local_part}@medical.com"
            license_number = f"PRO-{2000 + idx:04d}"

            professional = Professional.query.filter_by(email=email).first()
            created = False
            if not professional:
                professional = Professional(
                    email=email,
                    role="professional",
                    is_active=True,
                    license_number=license_number,
                )
                created = True
                db.session.add(professional)

            professional.first_name = first_name
            professional.last_name = last_name
            professional.specialty = module["label"]
            professional.phone = f"+5959813{idx:03d}00"
            professional.address = f"Consultorio {idx + 1}, Centro Medico San Rafael"
            professional.is_active = True
            professional.set_password(DEFAULT_PROFESSIONAL_PASSWORD)

            if professional.license_number != license_number:
                existing = Professional.query.filter(
                    Professional.license_number == license_number,
                    Professional.id != professional.id,
                ).first()
                if not existing:
                    professional.license_number = license_number

            self.professionals_by_module[module["key"]] = professional
            self.bump("professionals", created)

        db.session.flush()

    def seed_patients(self) -> None:
        for idx, (first_name, last_name) in enumerate(PATIENT_IDENTITIES):
            local = normalize_text(f"{first_name}.{last_name}")
            email = f"{local}@medical.com"
            patient = Patient.query.filter_by(email=email).first()
            created = False
            if not patient:
                patient = Patient(
                    email=email,
                    role="patient",
                    is_active=True,
                )
                created = True
                db.session.add(patient)

            patient.first_name = first_name
            patient.last_name = last_name
            patient.phone = f"+5959824{idx:03d}11"
            patient.address = f"Zona {idx % 7 + 1}, Gran Asuncion"
            patient.emergency_contact = f"Familiar de {first_name}"
            patient.emergency_phone = f"+5959829{idx:03d}22"
            patient.blood_type = BLOOD_TYPES[idx % len(BLOOD_TYPES)]
            patient.allergies = ALLERGIES[idx % len(ALLERGIES)]
            patient.medical_history = MEDICAL_BACKGROUNDS[idx % len(MEDICAL_BACKGROUNDS)]
            patient.date_of_birth = date(1988 + (idx % 16), (idx % 12) + 1, (idx % 27) + 1)
            patient.is_active = True
            patient.set_password(DEFAULT_PATIENT_PASSWORD)

            self.patients.append(patient)
            self.bump("patients", created)

        sample_patient = Patient.query.filter_by(email="patient@medical.com").first()
        if sample_patient and all(item.email != sample_patient.email for item in self.patients):
            self.patients.insert(0, sample_patient)

        db.session.flush()

    def seed_assignments(self) -> None:
        patient_count = len(self.patients)
        if patient_count == 0:
            return

        for idx, (module_key, professional) in enumerate(self.professionals_by_module.items()):
            selected = []
            for offset in (0, 3, 7, 11, 15):
                patient = self.patients[(idx * 2 + offset) % patient_count]
                if patient.id not in {item.id for item in selected}:
                    selected.append(patient)

                assignment = ProfessionalPatientAssignment.query.filter_by(
                    professional_id=professional.id,
                    patient_id=patient.id,
                ).first()
                created = False
                if not assignment:
                    assignment = ProfessionalPatientAssignment(
                        professional_id=professional.id,
                        patient_id=patient.id,
                        specialty_key=module_key,
                        assigned_at=self.now - timedelta(days=120 - (idx % 30)),
                    )
                    created = True
                    db.session.add(assignment)
                elif assignment.specialty_key != module_key:
                    assignment.specialty_key = module_key
                self.bump("assignments", created)

            self.module_patients[module_key] = selected

        db.session.flush()

    def seed_operational_flow(self) -> None:
        for idx, (module_key, professional) in enumerate(self.professionals_by_module.items()):
            module_label = self.module_by_key[module_key]["label"]
            scoped_patients = self.module_patients.get(module_key, [])[:3]
            for slot, patient in enumerate(scoped_patients, start=1):
                marker = f"{SEED_TAG}:FLOW:{module_key}:{patient.id}:{slot}"
                past_dt = self.past_anchor + timedelta(days=(idx * 3) + slot, hours=slot)
                future_dt = self.future_anchor + timedelta(days=(idx * 2) + slot, hours=slot)

                completed = self.ensure_appointment(
                    professional=professional,
                    patient=patient,
                    marker=f"{marker}:PAST",
                    appointment_date=past_dt,
                    status="completed",
                    appointment_type=f"Control de {module_label}",
                    reason=f"Seguimiento integral en {module_label.lower()}",
                )

                self.ensure_appointment(
                    professional=professional,
                    patient=patient,
                    marker=f"{marker}:FUTURE",
                    appointment_date=future_dt,
                    status="confirmed",
                    appointment_type=f"Revision de {module_label}",
                    reason=f"Control programado de {module_label.lower()}",
                )

                record = self.ensure_medical_record(
                    professional=professional,
                    patient=patient,
                    marker=f"{marker}:RECORD",
                    appointment=completed,
                    record_date=past_dt + timedelta(minutes=35),
                    module_label=module_label,
                )
                if record is not None:
                    self.seed_records.append(record)

                if slot <= 2:
                    self.ensure_budget_and_payment(
                        professional=professional,
                        patient=patient,
                        marker=f"{marker}:BUDGET",
                        module_label=module_label,
                    )

        db.session.flush()

    def ensure_appointment(
        self,
        professional: Professional,
        patient: Patient,
        marker: str,
        appointment_date: datetime,
        status: str,
        appointment_type: str,
        reason: str,
    ) -> Appointment:
        note_marker = f"[{marker}]"
        appointment = Appointment.query.filter_by(
            professional_id=professional.id,
            patient_id=patient.id,
            notes=note_marker,
        ).first()
        created = False
        if not appointment:
            appointment = Appointment(
                professional_id=professional.id,
                patient_id=patient.id,
                notes=note_marker,
            )
            created = True
            db.session.add(appointment)

        appointment.appointment_date = appointment_date
        appointment.duration_minutes = 40
        appointment.status = status
        appointment.appointment_type = appointment_type
        appointment.reason = reason
        appointment.reminder_sent = status in {"confirmed", "completed"}
        self.bump("appointments", created)
        return appointment

    def ensure_medical_record(
        self,
        professional: Professional,
        patient: Patient,
        marker: str,
        appointment: Appointment,
        record_date: datetime,
        module_label: str,
    ) -> MedicalRecord:
        note_marker = f"[{marker}]"
        record = MedicalRecord.query.filter_by(
            professional_id=professional.id,
            patient_id=patient.id,
            notes=note_marker,
        ).first()
        created = False
        if not record:
            record = MedicalRecord(
                professional_id=professional.id,
                patient_id=patient.id,
                notes=note_marker,
            )
            created = True
            db.session.add(record)

        record.appointment_id = appointment.id
        record.record_date = record_date
        record.chief_complaint = f"Control evolutivo en {module_label.lower()}."
        record.symptoms = "Dolor intermitente, fatiga funcional y molestias leves."
        record.diagnosis = f"Diagnostico funcional de seguimiento en {module_label.lower()}."
        record.treatment = "Ajuste de plan terapeutico, educacion y control en 30 dias."
        record.prescriptions = "Paracetamol 500mg si dolor, hidratacion y reposo relativo."
        record.blood_pressure = "120/80"
        record.heart_rate = 74
        record.temperature = 36.5
        record.weight = 70.0
        record.height = 170.0
        self.bump("medical_records", created)
        return record

    def ensure_budget_and_payment(
        self,
        professional: Professional,
        patient: Patient,
        marker: str,
        module_label: str,
    ) -> None:
        budget_title = f"[{marker}] Plan terapeutico {module_label}"
        budget = Budget.query.filter_by(
            patient_id=patient.id,
            created_by=professional.id,
            title=budget_title,
        ).first()
        created_budget = False
        if not budget:
            budget = Budget(
                patient_id=patient.id,
                created_by=professional.id,
                title=budget_title,
            )
            created_budget = True
            db.session.add(budget)

        total_amount = Decimal("420000.00")
        budget.description = "Plan integral con controles, procedimientos y seguimiento."
        budget.total_amount = total_amount
        budget.currency = "PYG"
        budget.status = "accepted"
        budget.valid_until = date(2026, 12, 31)
        budget.items = [
            {
                "description": "Consulta inicial",
                "quantity": 1,
                "unit_price": 120000,
                "total": 120000,
            },
            {
                "description": "Procedimiento principal",
                "quantity": 1,
                "unit_price": 250000,
                "total": 250000,
            },
            {
                "description": "Control evolutivo",
                "quantity": 1,
                "unit_price": 50000,
                "total": 50000,
            },
        ]
        self.bump("budgets", created_budget)
        db.session.flush()

        txid = f"{SEED_TAG}-PAY-{professional.id}-{patient.id}"
        payment = Payment.query.filter_by(transaction_id=txid).first()
        created_payment = False
        if not payment:
            payment = Payment(transaction_id=txid)
            created_payment = True
            db.session.add(payment)

        payment.budget_id = budget.id
        payment.amount = Decimal("180000.00")
        payment.currency = "PYG"
        payment.payment_method = "transfer"
        payment.payment_status = "completed"
        payment.payment_date = self.now - timedelta(days=9)
        payment.notes = f"[{SEED_TAG}] Primer pago confirmado."
        self.bump("payments", created_payment)

    def seed_specialty_encounters(self) -> None:
        for idx, (module_key, professional) in enumerate(self.professionals_by_module.items()):
            if module_key in LEGACY_MODULE_KEYS:
                continue

            module_label = self.module_by_key[module_key]["label"]
            for slot, patient in enumerate(self.module_patients.get(module_key, [])[:2], start=1):
                marker = f"{SEED_TAG}:ENCOUNTER:{module_key}:{patient.id}:{slot}"
                chief = f"[{marker}] Consulta de seguimiento en {module_label}."

                encounter = SpecialtyEncounter.query.filter_by(
                    professional_id=professional.id,
                    patient_id=patient.id,
                    specialty_key=module_key,
                    chief_complaint=chief,
                ).first()
                created = False
                if not encounter:
                    encounter = SpecialtyEncounter(
                        professional_id=professional.id,
                        patient_id=patient.id,
                        specialty_key=module_key,
                        chief_complaint=chief,
                    )
                    created = True
                    db.session.add(encounter)

                encounter.visit_date = self.past_anchor + timedelta(days=(idx * 2) + slot)
                encounter.status = "closed" if slot == 1 else "in_progress"
                encounter.diagnosis = f"Hallazgos compatibles con seguimiento de {module_label.lower()}."
                encounter.assessment = "Paciente estable, adherencia terapeutica adecuada."
                encounter.plan = "Mantener tratamiento y control clinico en 30 dias."
                encounter.notes = "Se registran indicadores clinicos estables."
                encounter.vitals = {
                    "blood_pressure": "118/76",
                    "heart_rate": 72 + slot,
                    "temperature": 36.4,
                    "weight": 68 + slot,
                }
                encounter.payload = {
                    "seed_tag": SEED_TAG,
                    "module": module_key,
                    "visit_context": "follow_up",
                }
                self.bump("specialty_encounters", created)

        db.session.flush()

    def seed_odontology_flow(self) -> None:
        professional = self.professionals_by_module.get("odontology")
        if professional is None:
            return

        for idx, patient in enumerate(self.module_patients.get("odontology", [])[:4], start=1):
            marker = f"{SEED_TAG}:ODO:{patient.id}"

            anamnesis = Anamnesis.query.filter_by(patient_id=patient.id).first()
            anamnesis_created = False
            if not anamnesis:
                anamnesis = Anamnesis(patient_id=patient.id)
                anamnesis_created = True
                db.session.add(anamnesis)
            anamnesis.professional_id = professional.id
            anamnesis.consultation_reason_items = ["pain", "cleaning"]
            anamnesis.current_illness = ["gingivitis"]
            anamnesis.medical_alerts = ["hypertension"] if idx % 2 == 0 else []
            anamnesis.medications = ["analgesics"]
            anamnesis.habits = ["coffee"]
            anamnesis.notes = f"[{marker}] Ficha anamnesis actualizada."
            anamnesis.last_dental_visit = date(2025, 12, 10)
            self.bump("anamnesis", anamnesis_created)

            odontogram = Odontogram.query.filter_by(patient_id=patient.id, is_active=True).first()
            odontogram_created = False
            if not odontogram:
                odontogram = Odontogram(
                    patient_id=patient.id,
                    professional_id=professional.id,
                    is_active=True,
                    notes=f"[{marker}] Odontograma activo.",
                )
                odontogram_created = True
                db.session.add(odontogram)
                db.session.flush()
            else:
                odontogram.professional_id = professional.id
                odontogram.notes = f"[{marker}] Odontograma activo."
            self.bump("odontograms", odontogram_created)

            tooth_status = {
                11: "healthy",
                12: "healthy",
                13: "filled",
                14: "caries",
                21: "healthy",
                22: "healthy",
                23: "healthy",
                24: "filled",
                31: "healthy",
                41: "healthy",
            }
            for tooth_number, status in tooth_status.items():
                tooth = Tooth.query.filter_by(
                    odontogram_id=odontogram.id,
                    tooth_number=tooth_number,
                ).first()
                tooth_created = False
                if not tooth:
                    tooth = Tooth(
                        odontogram_id=odontogram.id,
                        tooth_number=tooth_number,
                    )
                    tooth_created = True
                    db.session.add(tooth)

                tooth.tooth_type = "permanent"
                tooth.status = status
                tooth.mesial = "healthy"
                tooth.distal = "healthy"
                tooth.oclusal = "healthy" if status != "caries" else "caries"
                tooth.vestibular = "healthy"
                tooth.lingual = "healthy"
                tooth.gingival_status = "healthy"
                tooth.mobility = 0
                tooth.notes = f"[{marker}] Evaluacion odontologica de rutina."
                self.bump("teeth", tooth_created)

            treatment_code = f"{SEED_TAG}-ODO-{patient.id}"
            related_record = MedicalRecord.query.filter(
                MedicalRecord.patient_id == patient.id,
                MedicalRecord.professional_id == professional.id,
                MedicalRecord.notes.contains(SEED_TAG),
            ).order_by(MedicalRecord.record_date.desc()).first()

            treatment = DentalTreatment.query.filter_by(treatment_code=treatment_code).first()
            treatment_created = False
            if not treatment:
                treatment = DentalTreatment(
                    treatment_code=treatment_code,
                    patient_id=patient.id,
                    professional_id=professional.id,
                    treatment_type="Limpieza y restauracion",
                    treatment_date=date(2026, 2, 5) + timedelta(days=idx),
                )
                treatment_created = True
                db.session.add(treatment)

            treatment.patient_id = patient.id
            treatment.professional_id = professional.id
            treatment.medical_record_id = related_record.id if related_record else None
            treatment.treatment_type = "Limpieza y restauracion"
            treatment.treatment_date = date(2026, 2, 5) + timedelta(days=idx)
            treatment.affected_teeth = [14, 24]
            treatment.description = "Limpieza general y restauracion en piezas con caries inicial."
            treatment.materials_used = ["composite", "anestesia_local"]
            treatment.status = "completed"
            treatment.duration_minutes = 45
            treatment.sessions_required = 1
            treatment.session_number = 1
            treatment.estimated_cost = Decimal("350000.00")
            treatment.final_cost = Decimal("330000.00")
            treatment.pre_treatment_notes = "Dolor leve a la masticacion."
            treatment.post_treatment_notes = "Respuesta favorable al tratamiento."
            treatment.care_instructions = "Evitar alimentos duros por 24h."
            self.bump("dental_treatments", treatment_created)
            db.session.flush()

            for tooth_number in (14, 24):
                record = PeriodontalRecord.query.filter_by(
                    patient_id=patient.id,
                    tooth_number=tooth_number,
                    measurement_date=date(2026, 2, 12),
                ).first()
                perio_created = False
                if not record:
                    record = PeriodontalRecord(
                        patient_id=patient.id,
                        professional_id=professional.id,
                        odontogram_id=odontogram.id,
                        tooth_number=tooth_number,
                        measurement_date=date(2026, 2, 12),
                    )
                    perio_created = True
                    db.session.add(record)
                record.professional_id = professional.id
                record.odontogram_id = odontogram.id
                record.probing_depth_mb = 2
                record.probing_depth_b = 2
                record.probing_depth_db = 2
                record.probing_depth_ml = 2
                record.probing_depth_l = 2
                record.probing_depth_dl = 2
                record.bleeding = False
                record.plaque = tooth_number == 14
                record.notes = f"[{marker}] Control periodontal."
                self.bump("periodontal_records", perio_created)

            prescription_note = f"[{marker}] Receta post tratamiento."
            prescription = Prescription.query.filter_by(
                patient_id=patient.id,
                professional_id=professional.id,
                notes=prescription_note,
            ).first()
            prescription_created = False
            if not prescription:
                prescription = Prescription(
                    patient_id=patient.id,
                    professional_id=professional.id,
                    notes=prescription_note,
                )
                prescription_created = True
                db.session.add(prescription)
            prescription.treatment_id = treatment.id
            prescription.content = "Ibuprofeno 400mg cada 8 horas por 2 dias."
            prescription.status = "active"
            self.bump("prescriptions", prescription_created)

            document_title = f"[{marker}] Informe odontologico inicial"
            document = ClinicalDocument.query.filter_by(
                patient_id=patient.id,
                professional_id=professional.id,
                title=document_title,
            ).first()
            document_created = False
            if not document:
                document = ClinicalDocument(
                    patient_id=patient.id,
                    professional_id=professional.id,
                    title=document_title,
                    document_type="treatment_report",
                )
                document_created = True
                db.session.add(document)
            document.content = "Paciente con evolucion favorable y plan de control trimestral."
            document.is_active = True
            self.bump("clinical_documents", document_created)

        db.session.flush()

    def seed_psychology_flow(self) -> None:
        professional = self.professionals_by_module.get("psychology")
        if professional is None:
            return

        for idx, patient in enumerate(self.module_patients.get("psychology", [])[:4], start=1):
            marker = f"{SEED_TAG}:PSY:{patient.id}"
            reason = f"[{marker}] Evaluacion psicologica inicial."
            evaluation = PsychologicalEvaluation.query.filter_by(
                patient_id=patient.id,
                professional_id=professional.id,
                reason=reason,
            ).first()
            evaluation_created = False
            if not evaluation:
                evaluation = PsychologicalEvaluation(
                    patient_id=patient.id,
                    professional_id=professional.id,
                    reason=reason,
                )
                evaluation_created = True
                db.session.add(evaluation)

            evaluation.evaluation_date = date(2026, 1, 20) + timedelta(days=idx)
            evaluation.presenting_problem = "Ansiedad asociada a estres laboral."
            evaluation.current_symptoms = [
                {"symptom": "anxiety", "severity": "moderate", "frequency": "daily"},
                {"symptom": "sleep_disturbance", "severity": "mild", "frequency": "weekly"},
            ]
            evaluation.primary_diagnosis = "Trastorno de ansiedad generalizada"
            evaluation.treatment_recommendations = "Psicoterapia cognitivo conductual semanal."
            evaluation.therapy_type = "CBT"
            evaluation.frequency_recommended = "weekly"
            evaluation.status = "active"
            evaluation.additional_notes = "Buena red de apoyo familiar."
            self.bump("psychology_evaluations", evaluation_created)
            db.session.flush()

            for session_number in (1, 2, 3):
                session_marker = f"[{marker}] Sesion {session_number}"
                session = TherapySession.query.filter_by(
                    evaluation_id=evaluation.id,
                    session_number=session_number,
                ).first()
                session_created = False
                if not session:
                    session = TherapySession(
                        evaluation_id=evaluation.id,
                        patient_id=patient.id,
                        professional_id=professional.id,
                        session_number=session_number,
                        session_notes=session_marker,
                    )
                    session_created = True
                    db.session.add(session)

                session.session_date = date(2026, 1, 27) + timedelta(days=(idx * 7) + session_number)
                session.duration_minutes = 50
                session.session_type = "individual"
                session.modality = "in_person"
                session.patient_mood = "anxious" if session_number == 1 else "neutral"
                session.progress_rating = 3 + (session_number // 2)
                session.session_notes = (
                    f"{session_marker} Trabajo de respiracion y reestructuracion cognitiva."
                )
                session.next_session_plan = "Continuar con exposicion gradual y registro emocional."
                self.bump("therapy_sessions", session_created)

        db.session.flush()

    def seed_psychopedagogy_flow(self) -> None:
        professional = self.professionals_by_module.get("psychopedagogy")
        if professional is None:
            return

        for idx, patient in enumerate(self.module_patients.get("psychopedagogy", [])[:4], start=1):
            marker = f"{SEED_TAG}:PSP:{patient.id}"
            reason = f"[{marker}] Evaluacion psicopedagogica inicial."
            evaluation = PsychopedagogicalEvaluation.query.filter_by(
                patient_id=patient.id,
                professional_id=professional.id,
                reason=reason,
            ).first()
            evaluation_created = False
            if not evaluation:
                evaluation = PsychopedagogicalEvaluation(
                    patient_id=patient.id,
                    professional_id=professional.id,
                    reason=reason,
                )
                evaluation_created = True
                db.session.add(evaluation)

            evaluation.school_name = "Instituto San Miguel"
            evaluation.grade = "4to grado"
            evaluation.academic_year = 2026
            evaluation.presenting_problem = "Dificultades en comprension lectora y atencion sostenida."
            evaluation.reading_level = "below_grade"
            evaluation.math_level = "at_grade"
            evaluation.diagnosis = "Dificultad especifica de aprendizaje en lectura"
            evaluation.recommendations = "Intervencion psicopedagogica semanal y apoyo familiar."
            evaluation.intervention_plan = "Fortalecer conciencia fonologica y estrategias de estudio."
            evaluation.evaluation_date = date(2026, 1, 18) + timedelta(days=idx)
            evaluation.status = "active"
            self.bump("psychopedagogy_evaluations", evaluation_created)
            db.session.flush()

            for session_number in (1, 2, 3):
                session = InterventionSession.query.filter_by(
                    evaluation_id=evaluation.id,
                    session_number=session_number,
                ).first()
                session_created = False
                if not session:
                    session = InterventionSession(
                        evaluation_id=evaluation.id,
                        patient_id=patient.id,
                        professional_id=professional.id,
                        session_number=session_number,
                        focus_area="reading_comprehension",
                    )
                    session_created = True
                    db.session.add(session)

                session.session_date = date(2026, 1, 24) + timedelta(days=(idx * 7) + session_number)
                session.duration_minutes = 60
                session.focus_area = "reading_comprehension"
                session.student_engagement = "high"
                session.task_completion = 80 + session_number * 5
                session.accuracy_rate = 75 + session_number * 6
                session.progress_notes = (
                    f"[{marker}] Sesion {session_number}: progreso sostenido en estrategias lectoras."
                )
                session.next_session_plan = "Practicar resumen de textos cortos y secuenciacion."
                self.bump("intervention_sessions", session_created)

        db.session.flush()

    def seed_files(self) -> None:
        for record in self.seed_records[:30]:
            marker = f"{SEED_TAG}:FILE:{record.id}"
            filename = f"informe_clinico_{record.patient_id}_{record.professional_id}.pdf"
            file_row = File.query.filter_by(
                medical_record_id=record.id,
                filename=filename,
            ).first()
            created = False
            if not file_row:
                stored_name = f"{SEED_TAG.lower()}_{record.id}.pdf"
                file_path = self.upload_dir / stored_name
                if not file_path.exists():
                    payload = (
                        f"Medical Services\n"
                        f"Record ID: {record.id}\n"
                        f"Patient ID: {record.patient_id}\n"
                        f"Professional ID: {record.professional_id}\n"
                        f"Marker: {marker}\n"
                    ).encode("utf-8")
                    file_path.write_bytes(payload)

                file_row = File(
                    medical_record_id=record.id,
                    filename=filename,
                    file_type="medical_report",
                    mime_type="application/pdf",
                    file_size=file_path.stat().st_size,
                    storage_type="local",
                    file_path=str(file_path),
                    description=f"[{marker}] Informe clinico adjunto.",
                    uploaded_by=record.professional_id,
                )
                db.session.add(file_row)
                created = True
            self.bump("files", created)

        db.session.flush()

    def print_summary(self) -> None:
        print("\n" + "=" * 72)
        print("REALISTIC SEED COMPLETED")
        print("=" * 72)
        for key in sorted(self.stats):
            print(f"- {key}: {self.stats[key]}")
        print("=" * 72)
        print("Default credentials preserved:")
        print("  admin@medical.com / admin123")
        print("  doctor@medical.com / doctor123")
        print("  patient@medical.com / patient123")
        print("=" * 72 + "\n")


def main() -> None:
    app = create_app("development")
    with app.app_context():
        db.engine.echo = False
        seeder = RealisticDataSeeder()
        seeder.run()


if __name__ == "__main__":
    main()
