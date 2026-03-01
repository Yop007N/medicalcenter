# -*- coding: utf-8 -*-
"""Specialty module catalog and scoped overview service."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import func

from app.models.appointment import Appointment
from app.models.budget import Budget
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.professional import Professional
from app.models.specialty_encounter import SpecialtyEncounter
from app.services.access_scope_service import AccessScopeService
from app.services.exceptions import AccessDeniedError, ValidationError


SPECIALTY_MODULES = [
    {
        'key': 'odontology',
        'label': 'Odontología',
        'description': 'Historia clínica odontológica, odontograma, periodontograma y tratamientos.',
        'aliases': ['odontologia', 'odontology', 'odontologo', 'odontologa', 'ortodoncia', 'odontopediatria'],
        'route': '/odontology',
        'coreSections': ['Agenda clínica', 'Odontogramas', 'Tratamientos', 'Documentos', 'Recetas'],
    },
    {
        'key': 'psychology',
        'label': 'Psicología',
        'description': 'Evaluaciones psicológicas, sesiones terapéuticas y seguimiento.',
        'aliases': ['psicologia', 'psychology', 'psicologo', 'psicologa', 'psiquiatria'],
        'route': '/mental-health',
        'coreSections': ['Evaluaciones', 'Sesiones', 'Plan terapéutico', 'Indicadores', 'Derivaciones'],
    },
    {
        'key': 'psychopedagogy',
        'label': 'Psicopedagogía',
        'description': 'Evaluaciones psicopedagógicas e intervenciones por paciente.',
        'aliases': ['psicopedagogia', 'psychopedagogy', 'psicopedagogo', 'psicopedagoga'],
        'route': '/mental-health',
        'coreSections': ['Evaluaciones', 'Intervenciones', 'Objetivos', 'Progreso', 'Informes'],
    },
    {
        'key': 'cardiology',
        'label': 'Cardiología',
        'description': 'Seguimiento cardiovascular, controles clínicos y riesgo cardiometabólico.',
        'aliases': ['cardiologia', 'cardiology', 'cardiologo', 'cardiologa'],
        'route': '/specialties/cardiology',
        'coreSections': ['Consultas', 'Riesgo cardiovascular', 'Estudios', 'Tratamiento', 'Evolución'],
    },
    {
        'key': 'pediatrics',
        'label': 'Pediatría',
        'description': 'Atención pediátrica integral con controles de crecimiento y desarrollo.',
        'aliases': ['pediatria', 'pediatrics', 'pediatra'],
        'route': '/specialties/pediatrics',
        'coreSections': ['Controles', 'Vacunación', 'Crecimiento', 'Interconsultas', 'Educación familiar'],
    },
    {
        'key': 'gynecology',
        'label': 'Ginecología',
        'description': 'Consulta ginecológica, salud reproductiva y controles periódicos.',
        'aliases': ['ginecologia', 'ginecology', 'obstetricia', 'gineco-obstetricia'],
        'route': '/specialties/gynecology',
        'coreSections': ['Consultas', 'Controles', 'Estudios', 'Tratamientos', 'Seguimiento'],
    },
    {
        'key': 'traumatology',
        'label': 'Traumatología',
        'description': 'Atención osteoarticular, lesiones y rehabilitación funcional.',
        'aliases': ['traumatologia', 'traumatology', 'ortopedia', 'ortopedista'],
        'route': '/specialties/traumatology',
        'coreSections': ['Lesiones', 'Diagnóstico', 'Tratamiento', 'Rehabilitación', 'Control'],
    },
    {
        'key': 'neurology',
        'label': 'Neurología',
        'description': 'Evaluación neurológica y control de patologías del sistema nervioso.',
        'aliases': ['neurologia', 'neurology', 'neurologo', 'neurologa'],
        'route': '/specialties/neurology',
        'coreSections': ['Consulta', 'Síndromes', 'Estudios', 'Tratamiento', 'Seguimiento'],
    },
    {
        'key': 'internal-medicine',
        'label': 'Medicina Interna',
        'description': 'Gestión clínica integral de pacientes adultos y patologías crónicas.',
        'aliases': ['medicina interna', 'internal medicine', 'clinica medica'],
        'route': '/specialties/internal-medicine',
        'coreSections': ['Consulta', 'Crónicos', 'Interconsultas', 'Tratamiento', 'Evolución'],
    },
    {
        'key': 'dermatology',
        'label': 'Dermatología',
        'description': 'Diagnóstico y seguimiento de patologías cutáneas.',
        'aliases': ['dermatologia', 'dermatology', 'dermatologo', 'dermatologa'],
        'route': '/specialties/dermatology',
        'coreSections': ['Consulta', 'Lesiones', 'Tratamientos', 'Control', 'Documentación'],
    },
    {
        'key': 'endocrinology',
        'label': 'Endocrinología',
        'description': 'Control metabólico y endocrino de larga evolución.',
        'aliases': ['endocrinologia', 'endocrinology', 'endocrino'],
        'route': '/specialties/endocrinology',
        'coreSections': ['Consulta', 'Metabólico', 'Laboratorio', 'Ajustes', 'Seguimiento'],
    },
    {
        'key': 'gastroenterology',
        'label': 'Gastroenterología',
        'description': 'Atención digestiva y seguimiento de patologías gastrohepáticas.',
        'aliases': ['gastroenterologia', 'gastroenterology', 'gastro'],
        'route': '/specialties/gastroenterology',
        'coreSections': ['Consulta', 'Síntomas', 'Estudios', 'Tratamiento', 'Seguimiento'],
    },
    {
        'key': 'pulmonology',
        'label': 'Neumología',
        'description': 'Manejo respiratorio y patologías pulmonares crónicas/agudas.',
        'aliases': ['neumologia', 'pulmonology', 'neumologo', 'neumologa'],
        'route': '/specialties/pulmonology',
        'coreSections': ['Consulta', 'Función pulmonar', 'Crisis', 'Tratamiento', 'Control'],
    },
    {
        'key': 'urology',
        'label': 'Urología',
        'description': 'Atención del tracto urinario y salud urogenital.',
        'aliases': ['urologia', 'urology', 'urologo', 'urologa'],
        'route': '/specialties/urology',
        'coreSections': ['Consulta', 'Diagnóstico', 'Tratamiento', 'Intervención', 'Seguimiento'],
    },
    {
        'key': 'nephrology',
        'label': 'Nefrología',
        'description': 'Seguimiento renal y trastornos hidroelectrolíticos.',
        'aliases': ['nefrologia', 'nephrology', 'nefrologo', 'nefrologa'],
        'route': '/specialties/nephrology',
        'coreSections': ['Consulta', 'Función renal', 'Riesgo', 'Tratamiento', 'Control'],
    },
    {
        'key': 'oncology',
        'label': 'Oncología',
        'description': 'Atención oncológica, tratamiento y continuidad clínica.',
        'aliases': ['oncologia', 'oncology', 'oncologo', 'oncologa'],
        'route': '/specialties/oncology',
        'coreSections': ['Consulta', 'Estadificación', 'Tratamiento', 'Respuesta', 'Seguimiento'],
    },
    {
        'key': 'otolaryngology',
        'label': 'Otorrinolaringología',
        'description': 'Manejo de patología otorrino y vías aéreas superiores.',
        'aliases': ['otorrino', 'otorrinolaringologia', 'otolaryngology'],
        'route': '/specialties/otolaryngology',
        'coreSections': ['Consulta', 'Diagnóstico', 'Tratamiento', 'Procedimientos', 'Control'],
    },
    {
        'key': 'ophthalmology',
        'label': 'Oftalmología',
        'description': 'Evaluación visual y seguimiento oftalmológico.',
        'aliases': ['oftalmologia', 'ophthalmology', 'oculista'],
        'route': '/specialties/ophthalmology',
        'coreSections': ['Consulta', 'Agudeza visual', 'Diagnóstico', 'Tratamiento', 'Control'],
    },
    {
        'key': 'rheumatology',
        'label': 'Reumatología',
        'description': 'Atención músculo-esquelética inflamatoria y autoinmune.',
        'aliases': ['reumatologia', 'rheumatology', 'reumatologo', 'reumatologa'],
        'route': '/specialties/rheumatology',
        'coreSections': ['Consulta', 'Actividad inflamatoria', 'Tratamiento', 'Escalas', 'Seguimiento'],
    },
    {
        'key': 'infectology',
        'label': 'Infectología',
        'description': 'Diagnóstico y manejo de enfermedades infecciosas.',
        'aliases': ['infectologia', 'infectology', 'infectologo', 'infectologa'],
        'route': '/specialties/infectology',
        'coreSections': ['Consulta', 'Agente etiológico', 'Tratamiento', 'Aislamiento', 'Control'],
    },
    {
        'key': 'nutrition',
        'label': 'Nutrición',
        'description': 'Evaluación nutricional, plan alimentario y evolución.',
        'aliases': ['nutricion', 'nutrition', 'nutricionista'],
        'route': '/specialties/nutrition',
        'coreSections': ['Evaluación', 'Plan nutricional', 'Objetivos', 'Controles', 'Evolución'],
    },
    {
        'key': 'physiotherapy',
        'label': 'Fisioterapia',
        'description': 'Rehabilitación física y funcional por objetivos.',
        'aliases': ['fisioterapia', 'physiotherapy', 'kinesiologia', 'kinesiologo', 'kinesiologa'],
        'route': '/specialties/physiotherapy',
        'coreSections': ['Evaluación', 'Sesiones', 'Plan terapéutico', 'Indicadores', 'Alta'],
    },
    {
        'key': 'nursing',
        'label': 'Enfermería',
        'description': 'Cuidados de enfermería y seguimiento clínico continuo.',
        'aliases': ['enfermeria', 'nursing', 'enfermero', 'enfermera'],
        'route': '/specialties/nursing',
        'coreSections': ['Admisión', 'Ejecución', 'Medicaciones', 'Observaciones', 'Turnos'],
    },
    {
        'key': 'general-medicine',
        'label': 'Medicina General',
        'description': 'Atención clínica de primer nivel y coordinación asistencial.',
        'aliases': ['medicina general', 'general medicine', 'medico general', 'generalista'],
        'route': '/specialties/general-medicine',
        'coreSections': ['Consulta', 'Diagnóstico', 'Tratamiento', 'Derivaciones', 'Seguimiento'],
    },
]


DEFAULT_MODULE = {
    'key': 'general-medicine',
    'label': 'Medicina General',
    'description': 'Módulo clínico transversal para especialidades generales.',
    'aliases': [],
    'route': '/specialties/general-medicine',
    'coreSections': ['Consulta', 'Diagnóstico', 'Tratamiento', 'Seguimiento'],
}


class SpecialtyModuleService:
    """Provides specialty module metadata and actor-scoped overview data."""

    @staticmethod
    def _normalize(value):
        return AccessScopeService.normalize_text(value)

    @classmethod
    def get_catalog(cls):
        """Return full specialty module catalog."""
        return SPECIALTY_MODULES

    @classmethod
    def resolve_module(cls, specialty):
        """Resolve module by professional specialty aliases."""
        normalized_specialty = cls._normalize(specialty)
        if not normalized_specialty:
            return DEFAULT_MODULE

        for module in SPECIALTY_MODULES:
            aliases = module.get('aliases', [])
            if any(cls._normalize(alias) in normalized_specialty for alias in aliases):
                return module
        return DEFAULT_MODULE

    @classmethod
    def get_my_module(cls, current_user_id):
        """Get module definition for current authenticated actor."""
        user = AccessScopeService.get_user_or_raise(current_user_id)
        module = cls.resolve_module(getattr(user, 'specialty', None))
        return {
            'actor': user.role,
            'user_id': user.id,
            'specialty': getattr(user, 'specialty', None),
            'module': module,
        }

    @classmethod
    def _module_by_key(cls, module_key):
        """Resolve module by catalog key."""
        normalized_key = cls._normalize(module_key)
        if not normalized_key:
            return None

        for module in SPECIALTY_MODULES:
            if cls._normalize(module.get('key')) == normalized_key:
                return module

        if cls._normalize(DEFAULT_MODULE.get('key')) == normalized_key:
            return DEFAULT_MODULE
        return None

    @classmethod
    def get_module_by_key(cls, module_key):
        """Public resolver for module definitions by key."""
        return cls._module_by_key(module_key)

    @staticmethod
    def _empty_query(model):
        return model.query.filter(model.id == -1)

    @staticmethod
    def _distinct_ids(query, column):
        rows = query.with_entities(column).distinct().all()
        return {value for (value,) in rows if value is not None}

    @classmethod
    def _patient_query_for_ids(cls, patient_ids):
        if not patient_ids:
            return cls._empty_query(Patient)
        return Patient.query.filter(Patient.id.in_(sorted(patient_ids)))

    @classmethod
    def _professional_ids_for_module(cls, module_key):
        if not module_key:
            return set()

        rows = Professional.query.with_entities(Professional.id, Professional.specialty).all()
        matching_ids = set()
        for professional_id, specialty in rows:
            if cls.resolve_module(specialty).get('key') == module_key:
                matching_ids.add(professional_id)
        return matching_ids

    @classmethod
    def get_professional_ids_for_module(cls, module_key):
        """Public helper returning professional IDs linked to a module key."""
        return cls._professional_ids_for_module(module_key)

    @staticmethod
    def _serialize_appointment(appointment):
        return {
            'id': appointment.id,
            'patient_id': appointment.patient_id,
            'patient_name': (
                f'{appointment.patient.first_name} {appointment.patient.last_name}'
                if appointment.patient
                else f'Paciente #{appointment.patient_id}'
            ),
            'professional_id': appointment.professional_id,
            'professional_name': (
                f'{appointment.professional.first_name} {appointment.professional.last_name}'
                if appointment.professional
                else f'Profesional #{appointment.professional_id}'
            ),
            'status': appointment.status,
            'appointment_type': appointment.appointment_type,
            'appointment_date': appointment.appointment_date.isoformat(),
        }

    @staticmethod
    def _serialize_medical_record(record):
        return {
            'id': record.id,
            'patient_id': record.patient_id,
            'patient_name': (
                f'{record.patient.first_name} {record.patient.last_name}'
                if record.patient
                else f'Paciente #{record.patient_id}'
            ),
            'professional_id': record.professional_id,
            'professional_name': (
                f'{record.professional.first_name} {record.professional.last_name}'
                if record.professional
                else f'Profesional #{record.professional_id}'
            ),
            'record_date': record.record_date.isoformat() if record.record_date else None,
            'diagnosis': record.diagnosis,
            'treatment': record.treatment,
            'chief_complaint': record.chief_complaint,
            'notes': record.notes,
        }

    @staticmethod
    def _serialize_patient(patient):
        return {
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'email': patient.email,
            'phone': patient.phone,
            'is_active': patient.is_active,
        }

    @staticmethod
    def _serialize_specialty_encounter(encounter):
        return {
            'id': encounter.id,
            'specialty_key': encounter.specialty_key,
            'patient_id': encounter.patient_id,
            'patient_name': (
                f'{encounter.patient.first_name} {encounter.patient.last_name}'
                if encounter.patient
                else f'Paciente #{encounter.patient_id}'
            ),
            'professional_id': encounter.professional_id,
            'professional_name': (
                f'{encounter.professional.first_name} {encounter.professional.last_name}'
                if encounter.professional
                else f'Profesional #{encounter.professional_id}'
            ),
            'visit_date': encounter.visit_date.isoformat() if encounter.visit_date else None,
            'status': encounter.status,
            'chief_complaint': encounter.chief_complaint,
            'diagnosis': encounter.diagnosis,
            'assessment': encounter.assessment,
            'plan': encounter.plan,
            'notes': encounter.notes,
            'vitals': encounter.vitals,
            'payload': encounter.payload,
        }

    @staticmethod
    def _serialize_document(document):
        return {
            'id': document.id,
            'medical_record_id': document.medical_record_id,
            'patient_id': document.medical_record.patient_id if document.medical_record else None,
            'patient_name': (
                f'{document.medical_record.patient.first_name} '
                f'{document.medical_record.patient.last_name}'
                if document.medical_record and document.medical_record.patient
                else (
                    f'Paciente #{document.medical_record.patient_id}'
                    if document.medical_record
                    else None
                )
            ),
            'filename': document.filename,
            'file_type': document.file_type,
            'description': document.description,
            'created_at': document.created_at.isoformat() if document.created_at else None,
        }

    @classmethod
    def _collect_patient_ids(
        cls,
        appointment_query,
        medical_record_query,
        budget_query,
        specialty_key=None,
        specialty_professional_ids=None,
    ):
        patient_ids = set()
        patient_ids.update(cls._distinct_ids(appointment_query, Appointment.patient_id))
        patient_ids.update(cls._distinct_ids(medical_record_query, MedicalRecord.patient_id))
        patient_ids.update(cls._distinct_ids(budget_query, Budget.patient_id))

        if specialty_key:
            encounter_query = SpecialtyEncounter.query.filter(
                SpecialtyEncounter.specialty_key == specialty_key
            )
            if specialty_professional_ids is not None and specialty_professional_ids:
                encounter_query = encounter_query.filter(
                    SpecialtyEncounter.professional_id.in_(sorted(specialty_professional_ids))
                )
            patient_ids.update(cls._distinct_ids(encounter_query, SpecialtyEncounter.patient_id))
        return patient_ids

    @classmethod
    def _resolve_overview_module(cls, user, specialty_key=None):
        requested_module = None
        normalized_requested_key = cls._normalize(specialty_key)
        if normalized_requested_key:
            requested_module = cls._module_by_key(normalized_requested_key)
            if not requested_module:
                raise ValidationError('Invalid specialty_key')

        actor_module = cls.resolve_module(getattr(user, 'specialty', None))
        if user.role == 'professional':
            if requested_module and requested_module.get('key') != actor_module.get('key'):
                raise AccessDeniedError('Professional can only access own specialty module')
            return actor_module

        if requested_module:
            return requested_module
        return actor_module

    @classmethod
    def _build_scoped_queries(cls, user, module_key=None):
        """Build role-scoped queries for overview calculations."""
        if user.role == 'admin':
            if not module_key:
                return Patient.query, Appointment.query, MedicalRecord.query, Budget.query, Payment.query

            professional_ids = cls._professional_ids_for_module(module_key)
            if professional_ids:
                appointment_query = Appointment.query.filter(
                    Appointment.professional_id.in_(sorted(professional_ids))
                )
                medical_record_query = MedicalRecord.query.filter(
                    MedicalRecord.professional_id.in_(sorted(professional_ids))
                )
                budget_query = Budget.query.filter(Budget.created_by.in_(sorted(professional_ids)))
                payment_query = (
                    Payment.query.join(Budget, Payment.budget_id == Budget.id)
                    .filter(Budget.created_by.in_(sorted(professional_ids)))
                )
            else:
                appointment_query = cls._empty_query(Appointment)
                medical_record_query = cls._empty_query(MedicalRecord)
                budget_query = cls._empty_query(Budget)
                payment_query = cls._empty_query(Payment)

            patient_ids = cls._collect_patient_ids(
                appointment_query=appointment_query,
                medical_record_query=medical_record_query,
                budget_query=budget_query,
                specialty_key=module_key,
                specialty_professional_ids=professional_ids or None,
            )
            patient_query = cls._patient_query_for_ids(patient_ids)
            return patient_query, appointment_query, medical_record_query, budget_query, payment_query

        if user.role == 'professional':
            professional_module_key = cls.resolve_module(getattr(user, 'specialty', None)).get('key')
            if module_key and module_key != professional_module_key:
                raise AccessDeniedError('Professional can only access own specialty module')

            appointment_query = Appointment.query.filter(Appointment.professional_id == user.id)
            medical_record_query = MedicalRecord.query.filter(MedicalRecord.professional_id == user.id)
            budget_query = Budget.query.filter(Budget.created_by == user.id)
            payment_query = (
                Payment.query.join(Budget, Payment.budget_id == Budget.id)
                .filter(Budget.created_by == user.id)
            )

            if module_key:
                patient_ids = cls._collect_patient_ids(
                    appointment_query=appointment_query,
                    medical_record_query=medical_record_query,
                    budget_query=budget_query,
                    specialty_key=module_key,
                    specialty_professional_ids={user.id},
                )
            else:
                patient_ids = set(AccessScopeService.get_professional_patient_ids(user.id))
            patient_query = cls._patient_query_for_ids(patient_ids)
            return patient_query, appointment_query, medical_record_query, budget_query, payment_query

        if user.role == 'patient':
            patient_query = Patient.query.filter(Patient.id == user.id)
            appointment_query = Appointment.query.filter(Appointment.patient_id == user.id)
            medical_record_query = MedicalRecord.query.filter(MedicalRecord.patient_id == user.id)
            budget_query = Budget.query.filter(Budget.patient_id == user.id)
            payment_query = (
                Payment.query.join(Budget, Payment.budget_id == Budget.id)
                .filter(Budget.patient_id == user.id)
            )

            if module_key:
                professional_ids = cls._professional_ids_for_module(module_key)
                if professional_ids:
                    appointment_query = appointment_query.filter(
                        Appointment.professional_id.in_(sorted(professional_ids))
                    )
                    medical_record_query = medical_record_query.filter(
                        MedicalRecord.professional_id.in_(sorted(professional_ids))
                    )
                    budget_query = budget_query.filter(Budget.created_by.in_(sorted(professional_ids)))
                    payment_query = payment_query.filter(Budget.created_by.in_(sorted(professional_ids)))
                else:
                    appointment_query = cls._empty_query(Appointment)
                    medical_record_query = cls._empty_query(MedicalRecord)
                    budget_query = cls._empty_query(Budget)
                    payment_query = cls._empty_query(Payment)

                patient_ids = cls._collect_patient_ids(
                    appointment_query=appointment_query,
                    medical_record_query=medical_record_query,
                    budget_query=budget_query,
                    specialty_key=module_key,
                    specialty_professional_ids=professional_ids or None,
                )
                patient_query = (
                    Patient.query.filter(Patient.id == user.id)
                    if user.id in patient_ids
                    else cls._empty_query(Patient)
                )

            return patient_query, appointment_query, medical_record_query, budget_query, payment_query

        raise AccessDeniedError('Unsupported actor role')

    @classmethod
    def get_my_module_overview(cls, current_user_id, specialty_key=None):
        """Return overview metrics and operational lists for actor/module scope."""
        user = AccessScopeService.get_user_or_raise(current_user_id)
        module = cls._resolve_overview_module(user, specialty_key=specialty_key)
        scope_module_key = module.get('key') if specialty_key else None

        patient_query, appointment_query, medical_record_query, budget_query, payment_query = (
            cls._build_scoped_queries(user, module_key=scope_module_key)
        )
        now = datetime.utcnow()

        total_patients = patient_query.count()
        active_patients = patient_query.filter(Patient.is_active.is_(True)).count()
        appointments_total = appointment_query.count()
        appointments_upcoming = appointment_query.filter(
            Appointment.appointment_date >= now
        ).count()
        medical_records_total = medical_record_query.count()
        budgets_total = budget_query.count()
        completed_payments = payment_query.filter(Payment.payment_status == 'completed').count()
        completed_revenue = (
            payment_query.filter(Payment.payment_status == 'completed')
            .with_entities(func.sum(Payment.amount))
            .scalar()
            or Decimal('0.00')
        )

        upcoming_appointments = (
            appointment_query.order_by(Appointment.appointment_date.asc())
            .limit(8)
            .all()
        )
        appointment_rows = [cls._serialize_appointment(appointment) for appointment in upcoming_appointments]

        recent_records = (
            medical_record_query.order_by(MedicalRecord.record_date.desc())
            .limit(8)
            .all()
        )
        record_rows = [cls._serialize_medical_record(record) for record in recent_records]

        patients = patient_query.order_by(Patient.first_name.asc(), Patient.last_name.asc()).limit(12).all()
        patient_rows = [cls._serialize_patient(patient) for patient in patients]

        encounter_query = SpecialtyEncounter.query
        if scope_module_key:
            encounter_query = encounter_query.filter(SpecialtyEncounter.specialty_key == scope_module_key)

        if user.role == 'admin' and scope_module_key:
            module_professional_ids = cls._professional_ids_for_module(scope_module_key)
            if module_professional_ids:
                encounter_query = encounter_query.filter(
                    SpecialtyEncounter.professional_id.in_(sorted(module_professional_ids))
                )
            else:
                encounter_query = cls._empty_query(SpecialtyEncounter)
        elif user.role == 'professional':
            encounter_query = encounter_query.filter(SpecialtyEncounter.professional_id == user.id)
        elif user.role == 'patient':
            encounter_query = encounter_query.filter(SpecialtyEncounter.patient_id == user.id)

        recent_specialty_encounters = (
            encounter_query.order_by(SpecialtyEncounter.visit_date.desc())
            .limit(12)
            .all()
        )
        encounter_rows = [
            cls._serialize_specialty_encounter(encounter)
            for encounter in recent_specialty_encounters
        ]

        records_subquery = medical_record_query.with_entities(MedicalRecord.id).subquery()
        documents_query = File.query.join(
            records_subquery,
            File.medical_record_id == records_subquery.c.id
        )
        documents_total = documents_query.count()
        recent_documents = documents_query.order_by(File.created_at.desc()).limit(12).all()
        document_rows = [cls._serialize_document(document) for document in recent_documents]

        return {
            'actor': user.role,
            'specialty': getattr(user, 'specialty', None),
            'module': module,
            'totals': {
                'patients': total_patients,
                'patients_active': active_patients,
                'appointments_total': appointments_total,
                'appointments_upcoming': appointments_upcoming,
                'medical_records': medical_records_total,
                'budgets': budgets_total,
                'payments_completed': completed_payments,
                'revenue_completed': float(completed_revenue),
                'specialty_encounters': encounter_query.count(),
                'documents': documents_total,
                'currency': 'ARS',
            },
            'upcoming_appointments': appointment_rows,
            'recent_medical_records': record_rows,
            'recent_specialty_encounters': encounter_rows,
            'recent_documents': document_rows,
            'patients': patient_rows,
            'generated_at': now.isoformat(),
        }

    @classmethod
    def get_specialty_history(cls, current_user_id, specialty_key=None, patient_id=None):
        """Return specialty-scoped operational history for admin/professional/patient."""
        user = AccessScopeService.get_user_or_raise(current_user_id)
        module = cls._resolve_overview_module(user, specialty_key=specialty_key)
        scope_module_key = module.get('key') if specialty_key else None

        patient_query, appointment_query, medical_record_query, budget_query, payment_query = (
            cls._build_scoped_queries(user, module_key=scope_module_key)
        )

        if patient_id is not None:
            patient_in_scope = patient_query.filter(Patient.id == patient_id).first()
            if not patient_in_scope:
                raise AccessDeniedError('Patient is outside requested specialty scope')
            appointment_query = appointment_query.filter(Appointment.patient_id == patient_id)
            medical_record_query = medical_record_query.filter(MedicalRecord.patient_id == patient_id)
            budget_query = budget_query.filter(Budget.patient_id == patient_id)
            payment_query = payment_query.filter(Budget.patient_id == patient_id)
            patient_query = patient_query.filter(Patient.id == patient_id)

        encounter_query = SpecialtyEncounter.query
        if scope_module_key:
            encounter_query = encounter_query.filter(SpecialtyEncounter.specialty_key == scope_module_key)

        if user.role == 'admin' and scope_module_key:
            module_professional_ids = cls._professional_ids_for_module(scope_module_key)
            if module_professional_ids:
                encounter_query = encounter_query.filter(
                    SpecialtyEncounter.professional_id.in_(sorted(module_professional_ids))
                )
            else:
                encounter_query = cls._empty_query(SpecialtyEncounter)
        elif user.role == 'professional':
            encounter_query = encounter_query.filter(SpecialtyEncounter.professional_id == user.id)
        elif user.role == 'patient':
            encounter_query = encounter_query.filter(SpecialtyEncounter.patient_id == user.id)

        if patient_id is not None:
            encounter_query = encounter_query.filter(SpecialtyEncounter.patient_id == patient_id)

        records_subquery = medical_record_query.with_entities(MedicalRecord.id).subquery()
        documents_query = File.query.join(
            records_subquery,
            File.medical_record_id == records_subquery.c.id
        )

        patients = patient_query.order_by(Patient.first_name.asc(), Patient.last_name.asc()).limit(25).all()
        appointments = appointment_query.order_by(Appointment.appointment_date.desc()).limit(20).all()
        records = medical_record_query.order_by(MedicalRecord.record_date.desc()).limit(20).all()
        encounters = encounter_query.order_by(SpecialtyEncounter.visit_date.desc()).limit(20).all()
        documents = documents_query.order_by(File.created_at.desc()).limit(20).all()

        return {
            'actor': user.role,
            'specialty': getattr(user, 'specialty', None),
            'module': module,
            'filters': {
                'specialty_key': scope_module_key,
                'patient_id': patient_id,
            },
            'totals': {
                'patients': patient_query.count(),
                'appointments': appointment_query.count(),
                'medical_records': medical_record_query.count(),
                'budgets': budget_query.count(),
                'payments': payment_query.count(),
                'encounters': encounter_query.count(),
                'documents': documents_query.count(),
            },
            'patients': [cls._serialize_patient(patient) for patient in patients],
            'appointments': [cls._serialize_appointment(item) for item in appointments],
            'medical_records': [cls._serialize_medical_record(item) for item in records],
            'specialty_encounters': [cls._serialize_specialty_encounter(item) for item in encounters],
            'documents': [cls._serialize_document(item) for item in documents],
            'generated_at': datetime.utcnow().isoformat(),
        }
