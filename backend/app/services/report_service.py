# -*- coding: utf-8 -*-
"""
Report Service - Generación de reportes médicos, financieros y de agenda
"""

from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from app.extensions import db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.medical_record import MedicalRecord
from app.models.payment import Payment
from app.models.budget import Budget
from app.models.file import File
import io
import csv


class ReportService:
    """Servicio para generación de reportes"""

    # ============ REPORTES MÉDICOS ============

    @staticmethod
    def generate_patient_history_report(patient_id, start_date=None, end_date=None):
        """
        Genera reporte completo del historial médico de un paciente

        Args:
            patient_id: ID del paciente
            start_date: Fecha inicio (opcional)
            end_date: Fecha fin (opcional)

        Returns:
            dict con historial completo
        """
        patient = Patient.query.get(patient_id)
        if not patient:
            return None

        # Filtros de fecha
        filters = [MedicalRecord.patient_id == patient_id]
        if start_date:
            filters.append(MedicalRecord.created_at >= start_date)
        if end_date:
            filters.append(MedicalRecord.created_at <= end_date)

        # Obtener registros médicos
        medical_records = MedicalRecord.query.filter(
            and_(*filters)
        ).order_by(MedicalRecord.created_at.desc()).all()

        # Obtener turnos
        appointment_filters = [Appointment.patient_id == patient_id]
        if start_date:
            appointment_filters.append(Appointment.appointment_date >= start_date)
        if end_date:
            appointment_filters.append(Appointment.appointment_date <= end_date)

        appointments = Appointment.query.filter(
            and_(*appointment_filters)
        ).order_by(Appointment.appointment_date.desc()).all()

        # Obtener archivos
        file_ids = [mr.id for mr in medical_records]
        files = []
        if file_ids:
            files = File.query.filter(
                File.medical_record_id.in_(file_ids)
            ).all()

        return {
            'patient': {
                'id': patient.id,
                'full_name': f"{patient.first_name} {patient.last_name}",
                'email': patient.email,
                'date_of_birth': patient.date_of_birth.isoformat() if hasattr(patient, 'date_of_birth') and patient.date_of_birth else None,
                'phone': patient.phone if hasattr(patient, 'phone') else None,
                'address': patient.address if hasattr(patient, 'address') else None
            },
            'period': {
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None
            },
            'summary': {
                'total_records': len(medical_records),
                'total_appointments': len(appointments),
                'total_files': len(files),
                'completed_appointments': len([a for a in appointments if a.status == 'completed']),
                'pending_appointments': len([a for a in appointments if a.status == 'scheduled'])
            },
            'medical_records': [
                {
                    'id': mr.id,
                    'date': mr.created_at.isoformat(),
                    'professional_id': mr.professional_id,
                    'diagnosis': mr.diagnosis,
                    'treatment': mr.treatment,
                    'notes': mr.notes,
                    'vital_signs': {
                        'blood_pressure': mr.blood_pressure,
                        'heart_rate': mr.heart_rate,
                        'temperature': mr.temperature,
                        'weight': mr.weight,
                        'height': mr.height
                    }
                } for mr in medical_records
            ],
            'appointments': [
                {
                    'id': apt.id,
                    'date': apt.appointment_date.isoformat(),
                    'professional_id': apt.professional_id,
                    'status': apt.status,
                    'type': apt.appointment_type,
                    'duration': apt.duration_minutes,
                    'notes': apt.notes
                } for apt in appointments
            ],
            'files': [
                {
                    'id': f.id,
                    'filename': f.filename,
                    'file_type': f.file_type,
                    'uploaded_at': f.uploaded_at.isoformat(),
                    'medical_record_id': f.medical_record_id
                } for f in files
            ]
        }

    @staticmethod
    def generate_professional_activity_report(professional_id, start_date, end_date):
        """
        Genera reporte de actividad de un profesional

        Args:
            professional_id: ID del profesional
            start_date: Fecha inicio
            end_date: Fecha fin

        Returns:
            dict con actividad del profesional
        """
        professional = Professional.query.get(professional_id)
        if not professional:
            return None

        # Turnos del período
        appointments = Appointment.query.filter(
            and_(
                Appointment.professional_id == professional_id,
                Appointment.appointment_date >= start_date,
                Appointment.appointment_date <= end_date
            )
        ).all()

        # Registros médicos creados
        medical_records = MedicalRecord.query.filter(
            and_(
                MedicalRecord.professional_id == professional_id,
                MedicalRecord.created_at >= start_date,
                MedicalRecord.created_at <= end_date
            )
        ).all()

        # Estadísticas por estado de turno y tipo de turno
        status_stats_dict = {}
        type_stats_dict = {}
        for apt in appointments:
            status_stats_dict[apt.status] = status_stats_dict.get(apt.status, 0) + 1
            type_stats_dict[apt.appointment_type] = type_stats_dict.get(apt.appointment_type, 0) + 1

        status_stats = [(k, v) for k, v in status_stats_dict.items()]
        type_stats = [(k, v) for k, v in type_stats_dict.items()]

        return {
            'professional': {
                'id': professional.id,
                'full_name': f"{professional.first_name} {professional.last_name}",
                'license_number': professional.license_number,
                'specialty': professional.specialty
            },
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': (end_date - start_date).days + 1
            },
            'summary': {
                'total_appointments': len(appointments),
                'total_medical_records': len(medical_records),
                'completed_appointments': len([a for a in appointments if a.status == 'completed']),
                'cancelled_appointments': len([a for a in appointments if a.status == 'cancelled']),
                'total_hours': sum(a.duration_minutes or 0 for a in appointments) / 60,
                'unique_patients': len(set(a.patient_id for a in appointments))
            },
            'by_status': {status: count for status, count in status_stats},
            'by_type': {atype: count for atype, count in type_stats},
            'daily_breakdown': ReportService._get_daily_breakdown(appointments, start_date, end_date)
        }

    # ============ REPORTES FINANCIEROS ============

    @staticmethod
    def generate_revenue_report(start_date, end_date, professional_id=None):
        """
        Genera reporte de ingresos

        Args:
            start_date: Fecha inicio
            end_date: Fecha fin
            professional_id: Filtrar por profesional (opcional)

        Returns:
            dict con análisis de ingresos
        """
        filters = [
            Payment.payment_date >= start_date,
            Payment.payment_date <= end_date,
            Payment.payment_status == 'completed'
        ]

        if professional_id:
            # Filtrar pagos relacionados a turnos del profesional
            filters.append(
                Payment.budget_id.in_(
                    db.session.query(Budget.id).filter(
                        Budget.created_by == professional_id
                    )
                )
            )

        payments = Payment.query.filter(and_(*filters)).all()

        # Agrupar por método de pago e Ingresos por día
        by_method_dict = {}
        daily_revenue_dict = {}
        total_amount = 0.0
        amounts = []

        for p in payments:
            amt = float(p.amount)
            amounts.append(amt)
            total_amount += amt

            # Agrupar por método
            by_method_dict[p.payment_method] = by_method_dict.get(p.payment_method, 0.0) + amt

            # Ingresos por día
            date_str = p.payment_date.date().isoformat() if hasattr(p.payment_date, 'date') else str(p.payment_date).split(' ')[0]
            daily_revenue_dict[date_str] = daily_revenue_dict.get(date_str, 0.0) + amt

        by_method = [(k, v) for k, v in by_method_dict.items()]
        # daily_revenue_dict needs to be sorted by date
        daily_revenue = [(k, v) for k, v in sorted(daily_revenue_dict.items())]

        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': (end_date - start_date).days + 1
            },
            'summary': {
                'total_revenue': total_amount,
                'total_transactions': len(payments),
                'average_transaction': total_amount / len(payments) if payments else 0,
                'largest_payment': max(amounts) if amounts else 0,
                'smallest_payment': min(amounts) if amounts else 0
            },
            'by_payment_method': {method: float(total) if total else 0 for method, total in by_method},
            'daily_revenue': [
                {
                    'date': date.isoformat() if hasattr(date, 'isoformat') else str(date),
                    'amount': float(total) if total else 0
                } for date, total in daily_revenue
            ],
            'payments': [
                {
                    'id': p.id,
                    'date': p.payment_date.isoformat(),
                    'amount': float(p.amount),
                    'method': p.payment_method,
                    'budget_id': p.budget_id
                } for p in payments
            ]
        }

    @staticmethod
    def generate_budget_report(start_date, end_date, status=None):
        """
        Genera reporte de presupuestos

        Args:
            start_date: Fecha inicio
            end_date: Fecha fin
            status: Filtrar por estado (opcional)

        Returns:
            dict con análisis de presupuestos
        """
        filters = [
            Budget.created_at >= start_date,
            Budget.created_at <= end_date
        ]

        if status:
            filters.append(Budget.status == status)

        budgets = Budget.query.filter(and_(*filters)).all()

        # Estadísticas por estado
        by_status_dict = {}
        total_amount = 0.0

        for b in budgets:
            amt = float(b.total_amount)
            total_amount += amt
            if b.status not in by_status_dict:
                by_status_dict[b.status] = {'count': 0, 'total': 0.0}
            by_status_dict[b.status]['count'] += 1
            by_status_dict[b.status]['total'] += amt

        by_status = [
            (status, stats['count'], stats['total'])
            for status, stats in by_status_dict.items()
        ]

        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'summary': {
                'total_budgets': len(budgets),
                'total_amount': total_amount,
                'average_budget': total_amount / len(budgets) if budgets else 0,
                'pending_budgets': len([b for b in budgets if b.status == 'draft']),
                'accepted_budgets': len([b for b in budgets if b.status == 'accepted']),
                'rejected_budgets': len([b for b in budgets if b.status == 'rejected'])
            },
            'by_status': [
                {
                    'status': status,
                    'count': count,
                    'total_amount': float(total) if total else 0
                } for status, count, total in by_status
            ],
            'budgets': [
                {
                    'id': b.id,
                    'date': b.created_at.isoformat(),
                    'patient_id': b.patient_id,
                    'professional_id': b.created_by,
                    'status': b.status,
                    'total_amount': float(b.total_amount),
                    'description': b.description
                } for b in budgets
            ]
        }

    # ============ REPORTES DE AGENDA ============

    @staticmethod
    def generate_appointment_report(start_date, end_date, professional_id=None, patient_id=None):
        """
        Genera reporte de turnos

        Args:
            start_date: Fecha inicio
            end_date: Fecha fin
            professional_id: Filtrar por profesional (opcional)
            patient_id: Filtrar por paciente (opcional)

        Returns:
            dict con análisis de turnos
        """
        filters = [
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date
        ]

        if professional_id:
            filters.append(Appointment.professional_id == professional_id)
        if patient_id:
            filters.append(Appointment.patient_id == patient_id)

        appointments = Appointment.query.filter(and_(*filters)).all()

        # Estadísticas por estado, tipo y día de la semana
        by_status_dict = {}
        by_type_dict = {}
        by_weekday = {}

        for apt in appointments:
            by_status_dict[apt.status] = by_status_dict.get(apt.status, 0) + 1
            by_type_dict[apt.appointment_type] = by_type_dict.get(apt.appointment_type, 0) + 1

            weekday = apt.appointment_date.strftime('%A')
            by_weekday[weekday] = by_weekday.get(weekday, 0) + 1

        by_status = [(k, v) for k, v in by_status_dict.items()]
        by_type = [(k, v) for k, v in by_type_dict.items()]

        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': (end_date - start_date).days + 1
            },
            'summary': {
                'total_appointments': len(appointments),
                'completed': len([a for a in appointments if a.status == 'completed']),
                'scheduled': len([a for a in appointments if a.status == 'scheduled']),
                'cancelled': len([a for a in appointments if a.status == 'cancelled']),
                'no_show': len([a for a in appointments if a.status == 'no_show']),
                'total_hours': sum(a.duration_minutes or 0 for a in appointments) / 60,
                'average_duration': sum(a.duration_minutes or 0 for a in appointments) / len(appointments) if appointments else 0
            },
            'by_status': {status: count for status, count in by_status},
            'by_type': {atype: count for atype, count in by_type},
            'by_weekday': by_weekday,
            'daily_breakdown': ReportService._get_daily_breakdown(appointments, start_date, end_date)
        }

    # ============ EXPORTACIÓN ============

    @staticmethod
    def export_to_csv(data, report_type):
        """
        Exporta reporte a CSV

        Args:
            data: Datos del reporte
            report_type: Tipo de reporte

        Returns:
            StringIO con contenido CSV
        """
        output = io.StringIO()

        if report_type == 'patient_history':
            writer = csv.writer(output)
            writer.writerow(['Paciente', 'Período', 'Total Registros', 'Total Turnos', 'Total Archivos'])
            writer.writerow([
                data['patient']['full_name'],
                f"{data['period']['start_date']} - {data['period']['end_date']}",
                data['summary']['total_records'],
                data['summary']['total_appointments'],
                data['summary']['total_files']
            ])
            writer.writerow([])
            writer.writerow(['Registros Médicos'])
            writer.writerow(['ID', 'Fecha', 'Diagnóstico', 'Tratamiento'])
            for mr in data['medical_records']:
                writer.writerow([mr['id'], mr['date'], mr['diagnosis'], mr['treatment']])

        elif report_type == 'revenue':
            writer = csv.writer(output)
            writer.writerow(['Reporte de Ingresos'])
            writer.writerow(['Período', f"{data['period']['start_date']} - {data['period']['end_date']}"])
            writer.writerow(['Total Ingresos', data['summary']['total_revenue']])
            writer.writerow(['Total Transacciones', data['summary']['total_transactions']])
            writer.writerow([])
            writer.writerow(['Fecha', 'Monto', 'Método', 'Presupuesto ID'])
            for p in data['payments']:
                writer.writerow([p['date'], p['amount'], p['method'], p['budget_id']])

        elif report_type == 'appointments':
            writer = csv.writer(output)
            writer.writerow(['Reporte de Turnos'])
            writer.writerow(['Período', f"{data['period']['start_date']} - {data['period']['end_date']}"])
            writer.writerow(['Total Turnos', data['summary']['total_appointments']])
            writer.writerow(['Completados', data['summary']['completed']])
            writer.writerow(['Cancelados', data['summary']['cancelled']])
            writer.writerow([])
            writer.writerow(['Por Estado'])
            for status, count in data['by_status'].items():
                writer.writerow([status, count])

        output.seek(0)
        return output

    # ============ HELPERS ============

    @staticmethod
    def _get_daily_breakdown(appointments, start_date, end_date):
        """Calcula desglose diario de turnos"""
        daily = {}
        current = start_date

        while current <= end_date:
            date_str = current.date().isoformat()
            daily[date_str] = {
                'date': date_str,
                'count': 0,
                'completed': 0,
                'cancelled': 0,
                'scheduled': 0
            }
            current += timedelta(days=1)

        for apt in appointments:
            date_str = apt.appointment_date.date().isoformat()
            if date_str in daily:
                daily[date_str]['count'] += 1
                if apt.status == 'completed':
                    daily[date_str]['completed'] += 1
                elif apt.status == 'cancelled':
                    daily[date_str]['cancelled'] += 1
                elif apt.status == 'scheduled':
                    daily[date_str]['scheduled'] += 1

        return list(daily.values())
