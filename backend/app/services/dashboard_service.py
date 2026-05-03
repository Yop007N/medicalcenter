# -*- coding: utf-8 -*-
"""Dashboard analytics service."""

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func

from app.extensions import db
from app.models.appointment import Appointment
from app.models.budget import Budget
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.professional import Professional
from app.services.access_scope_service import AccessScopeService


class DashboardService:
    """Encapsulates dashboard and KPI queries."""

    @staticmethod
    def format_year_month(date_column):
        """Format dates as YYYY-MM for sqlite/postgres compatibility."""
        if db.engine.dialect.name == 'sqlite':
            return func.strftime('%Y-%m', date_column)
        return func.to_char(date_column, 'YYYY-MM')

    @staticmethod
    def get_overview(current_user_id=None):
        """Get platform overview scoped by actor."""
        user = None
        if current_user_id is not None:
            user = AccessScopeService.get_user_or_raise(current_user_id)

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        if not user or user.role == 'admin':
            total_patients = Patient.query.filter_by(is_active=True).count()
            total_professionals = Professional.query.filter_by(is_active=True).count()
            total_appointments = Appointment.query.count()
            total_medical_records = MedicalRecord.query.count()

            new_patients = Patient.query.filter(Patient.created_at >= thirty_days_ago).count()
            recent_appointments = Appointment.query.filter(
                Appointment.created_at >= thirty_days_ago
            ).count()

            appointment_status = (
                db.session.query(
                    Appointment.status,
                    func.count(Appointment.id).label('count'),
                )
                .group_by(Appointment.status)
                .all()
            )
            status_distribution = {status: count for status, count in appointment_status}

            total_budgets = Budget.query.count()
            total_payments = Payment.query.count()
            total_revenue = (
                db.session.query(func.sum(Payment.amount))
                .filter(Payment.payment_status == 'completed')
                .scalar()
                or Decimal('0.00')
            )
        else:
            if user.role == 'professional':
                scoped_patient_ids = list(AccessScopeService.get_professional_patient_ids(user.id))
                patient_query = Patient.query.filter(
                    Patient.id.in_(scoped_patient_ids)
                ) if scoped_patient_ids else Patient.query.filter(Patient.id == -1)
                appointment_query = Appointment.query.filter(
                    Appointment.professional_id == user.id
                )
                medical_record_query = MedicalRecord.query.filter(
                    MedicalRecord.professional_id == user.id
                )
                budget_query = Budget.query.filter(Budget.created_by == user.id)
                payment_query = (
                    Payment.query.join(Budget, Payment.budget_id == Budget.id)
                    .filter(Budget.created_by == user.id)
                )
                total_professionals = 1
            elif user.role == 'patient':
                patient_query = Patient.query.filter(Patient.id == user.id)
                appointment_query = Appointment.query.filter(Appointment.patient_id == user.id)
                medical_record_query = MedicalRecord.query.filter(MedicalRecord.patient_id == user.id)
                budget_query = Budget.query.filter(Budget.patient_id == user.id)
                payment_query = (
                    Payment.query.join(Budget, Payment.budget_id == Budget.id)
                    .filter(Budget.patient_id == user.id)
                )
                total_professionals = (
                    db.session.query(func.count(func.distinct(Appointment.professional_id)))
                    .filter(Appointment.patient_id == user.id)
                    .scalar()
                    or 0
                )
            else:
                patient_query = Patient.query.filter(Patient.id == -1)
                appointment_query = Appointment.query.filter(Appointment.id == -1)
                medical_record_query = MedicalRecord.query.filter(MedicalRecord.id == -1)
                budget_query = Budget.query.filter(Budget.id == -1)
                payment_query = Payment.query.filter(Payment.id == -1)
                total_professionals = 0

            total_patients = patient_query.filter(Patient.is_active.is_(True)).count()
            total_appointments = appointment_query.count()
            total_medical_records = medical_record_query.count()
            total_budgets = budget_query.count()
            total_payments = payment_query.count()
            new_patients = patient_query.filter(Patient.created_at >= thirty_days_ago).count()
            recent_appointments = appointment_query.filter(
                Appointment.created_at >= thirty_days_ago
            ).count()

            appointment_status = (
                appointment_query.with_entities(
                    Appointment.status,
                    func.count(Appointment.id).label('count'),
                )
                .group_by(Appointment.status)
                .all()
            )
            status_distribution = {status: count for status, count in appointment_status}
            total_revenue = (
                payment_query.filter(Payment.payment_status == 'completed')
                .with_entities(func.sum(Payment.amount))
                .scalar()
                or Decimal('0.00')
            )

        return {
            'totals': {
                'patients': total_patients,
                'professionals': total_professionals,
                'appointments': total_appointments,
                'medical_records': total_medical_records,
                'budgets': total_budgets,
                'payments': total_payments,
            },
            'recent_activity': {
                'new_patients_30d': new_patients,
                'appointments_30d': recent_appointments,
            },
            'appointment_status': status_distribution,
            'revenue': {
                'total': float(total_revenue),
                'currency': 'PYG',
            },
            'generated_at': datetime.utcnow().isoformat(),
        }

    @staticmethod
    def get_appointment_stats():
        """Get appointment KPIs."""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        today_appointments = Appointment.query.filter(
            Appointment.appointment_date >= today_start,
            Appointment.appointment_date < today_end,
        ).count()

        week_start = today_start - timedelta(days=today_start.weekday())
        week_end = week_start + timedelta(days=7)
        week_appointments = Appointment.query.filter(
            Appointment.appointment_date >= week_start,
            Appointment.appointment_date < week_end,
        ).count()

        month_start = today_start.replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)
        month_appointments = Appointment.query.filter(
            Appointment.appointment_date >= month_start,
            Appointment.appointment_date < month_end,
        ).count()

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        completed_appointments = Appointment.query.filter(
            Appointment.created_at >= thirty_days_ago,
            Appointment.status == 'completed',
        ).count()
        total_past_appointments = Appointment.query.filter(
            Appointment.created_at >= thirty_days_ago,
            Appointment.appointment_date < datetime.utcnow(),
        ).count()
        completion_rate = (
            completed_appointments / total_past_appointments * 100
            if total_past_appointments > 0
            else 0
        )

        no_show_appointments = Appointment.query.filter(
            Appointment.created_at >= thirty_days_ago,
            Appointment.status == 'no_show',
        ).count()
        no_show_rate = (
            no_show_appointments / total_past_appointments * 100
            if total_past_appointments > 0
            else 0
        )

        top_professionals = (
            db.session.query(
                Professional.id,
                Professional.first_name,
                Professional.last_name,
                Professional.specialty,
                func.count(Appointment.id).label('appointment_count'),
            )
            .join(Appointment)
            .filter(Appointment.created_at >= thirty_days_ago)
            .group_by(
                Professional.id,
                Professional.first_name,
                Professional.last_name,
                Professional.specialty,
            )
            .order_by(func.count(Appointment.id).desc())
            .limit(5)
            .all()
        )
        top_professionals_list = [
            {
                'id': prof.id,
                'name': f'{prof.first_name} {prof.last_name}',
                'specialty': prof.specialty,
                'appointments': prof.appointment_count,
            }
            for prof in top_professionals
        ]

        return {
            'periods': {
                'today': today_appointments,
                'this_week': week_appointments,
                'this_month': month_appointments,
            },
            'metrics': {
                'completion_rate': round(completion_rate, 2),
                'no_show_rate': round(no_show_rate, 2),
            },
            'top_professionals': top_professionals_list,
            'generated_at': datetime.utcnow().isoformat(),
        }

    @staticmethod
    def get_revenue_stats():
        """Get financial KPIs."""
        revenue_by_status = (
            db.session.query(
                Payment.payment_status,
                func.sum(Payment.amount).label('total'),
                func.count(Payment.id).label('count'),
            )
            .group_by(Payment.payment_status)
            .all()
        )
        revenue_breakdown = {
            status: {'total': float(total), 'count': count}
            for status, total, count in revenue_by_status
        }

        six_months_ago = datetime.utcnow() - timedelta(days=180)
        month_expr = DashboardService.format_year_month(Payment.payment_date)
        monthly_revenue = (
            db.session.query(month_expr.label('month'), func.sum(Payment.amount).label('total'))
            .filter(
                Payment.payment_date >= six_months_ago,
                Payment.payment_status == 'completed',
            )
            .group_by(month_expr)
            .order_by(month_expr)
            .all()
        )
        monthly_data = [
            {'month': month if month else 'Unknown', 'revenue': float(total)}
            for month, total in monthly_revenue
        ]

        avg_payment = (
            db.session.query(func.avg(Payment.amount))
            .filter(Payment.payment_status == 'completed')
            .scalar()
            or Decimal('0.00')
        )
        pending_amount = (
            db.session.query(func.sum(Payment.amount))
            .filter(Payment.payment_status == 'pending')
            .scalar()
            or Decimal('0.00')
        )

        payment_methods = (
            db.session.query(
                Payment.payment_method,
                func.count(Payment.id).label('count'),
                func.sum(Payment.amount).label('total'),
            )
            .filter(Payment.payment_status == 'completed')
            .group_by(Payment.payment_method)
            .all()
        )
        methods_distribution = {
            method: {'count': count, 'total': float(total)}
            for method, count, total in payment_methods
        }

        return {
            'revenue_by_status': revenue_breakdown,
            'monthly_revenue': monthly_data,
            'metrics': {
                'average_transaction': float(avg_payment),
                'pending_amount': float(pending_amount),
            },
            'payment_methods': methods_distribution,
            'generated_at': datetime.utcnow().isoformat(),
        }

    @staticmethod
    def get_patient_stats():
        """Get patient and growth KPIs."""
        total_active = Patient.query.filter_by(is_active=True).count()
        total_inactive = Patient.query.filter_by(is_active=False).count()

        twelve_months_ago = datetime.utcnow() - timedelta(days=365)
        month_expr = DashboardService.format_year_month(Patient.created_at)
        monthly_new_patients = (
            db.session.query(month_expr.label('month'), func.count(Patient.id).label('count'))
            .filter(Patient.created_at >= twelve_months_ago)
            .group_by(month_expr)
            .order_by(month_expr)
            .all()
        )
        monthly_data = [
            {'month': month if month else 'Unknown', 'new_patients': count}
            for month, count in monthly_new_patients
        ]

        patients_with_records = db.session.query(
            func.count(func.distinct(MedicalRecord.patient_id))
        ).scalar() or 0

        # ⚡ Bolt Optimization:
        # Replaced O(N) correlated subquery `func.avg(db.session.query(count(Appointment.id)).correlate(Patient))`
        # with O(1) mathematical equivalent: Total Appointments / Total Patients.
        total_patients = total_active + total_inactive
        total_appointments = Appointment.query.count()
        avg_appointments = total_appointments / total_patients if total_patients > 0 else 0

        return {
            'totals': {
                'active': total_active,
                'inactive': total_inactive,
                'with_medical_records': patients_with_records,
            },
            'monthly_new_patients': monthly_data,
            'metrics': {
                'avg_appointments_per_patient': round(float(avg_appointments), 2),
            },
            'generated_at': datetime.utcnow().isoformat(),
        }

    @staticmethod
    def get_files_stats():
        """Get file storage KPIs."""
        total_files = File.query.count()
        total_storage = db.session.query(func.sum(File.file_size)).scalar() or 0

        files_by_type = (
            db.session.query(
                File.file_type,
                func.count(File.id).label('count'),
                func.sum(File.file_size).label('total_size'),
            )
            .group_by(File.file_type)
            .all()
        )
        type_distribution = {
            file_type: {
                'count': count,
                'size_bytes': int(total_size),
                'size_mb': round(total_size / (1024 * 1024), 2),
            }
            for file_type, count, total_size in files_by_type
        }

        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_uploads = File.query.filter(File.created_at >= seven_days_ago).count()

        return {
            'totals': {
                'files': total_files,
                'storage_bytes': int(total_storage),
                'storage_mb': round(total_storage / (1024 * 1024), 2),
                'storage_gb': round(total_storage / (1024 * 1024 * 1024), 2),
            },
            'files_by_type': type_distribution,
            'recent_uploads_7d': recent_uploads,
            'generated_at': datetime.utcnow().isoformat(),
        }

    @staticmethod
    def get_recent_activity(current_user_id=None):
        """Get recent activity feed across appointments/payments/files."""
        user = None
        if current_user_id is not None:
            user = AccessScopeService.get_user_or_raise(current_user_id)

        appointment_query = Appointment.query
        payment_query = Payment.query
        file_query = File.query

        if user and user.role == 'professional':
            appointment_query = appointment_query.filter(Appointment.professional_id == user.id)
            payment_query = payment_query.join(Budget, Payment.budget_id == Budget.id).filter(
                Budget.created_by == user.id
            )
            file_query = file_query.join(
                MedicalRecord, File.medical_record_id == MedicalRecord.id
            ).filter(MedicalRecord.professional_id == user.id)
        elif user and user.role == 'patient':
            appointment_query = appointment_query.filter(Appointment.patient_id == user.id)
            payment_query = payment_query.join(Budget, Payment.budget_id == Budget.id).filter(
                Budget.patient_id == user.id
            )
            file_query = file_query.join(
                MedicalRecord, File.medical_record_id == MedicalRecord.id
            ).filter(MedicalRecord.patient_id == user.id)

        recent_appointments = appointment_query.order_by(
            Appointment.created_at.desc()
        ).limit(10).all()
        appointments_data = [
            {
                'id': apt.id,
                'patient_id': apt.patient_id,
                'professional_id': apt.professional_id,
                'date': apt.appointment_date.isoformat(),
                'status': apt.status,
                'created_at': apt.created_at.isoformat(),
            }
            for apt in recent_appointments
        ]

        recent_payments = payment_query.order_by(Payment.created_at.desc()).limit(10).all()
        payments_data = [
            {
                'id': pmt.id,
                'amount': float(pmt.amount),
                'status': pmt.payment_status,
                'method': pmt.payment_method,
                'created_at': pmt.created_at.isoformat(),
            }
            for pmt in recent_payments
        ]

        recent_files = file_query.order_by(File.created_at.desc()).limit(10).all()
        files_data = [
            {
                'id': file.id,
                'filename': file.filename,
                'file_type': file.file_type,
                'size_mb': round(file.file_size / (1024 * 1024), 2),
                'created_at': file.created_at.isoformat(),
            }
            for file in recent_files
        ]

        return {
            'recent_appointments': appointments_data,
            'recent_payments': payments_data,
            'recent_files': files_data,
            'generated_at': datetime.utcnow().isoformat(),
        }
