# -*- coding: utf-8 -*-
"""
Dashboard and Analytics endpoints
Provides metrics and KPIs for the medical services platform
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.budget import Budget
from app.models.payment import Payment
from app.models.file import File
from app.extensions import db
from datetime import datetime, timedelta
from sqlalchemy import func, case, extract
from decimal import Decimal

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


def format_year_month(date_column):
    """Helper to format date as YYYY-MM for PostgreSQL"""
    return func.to_char(date_column, 'YYYY-MM')


@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    """
    Get general overview metrics

    Returns:
        JSON with overall system statistics
    """
    try:
        # Count totals
        total_patients = Patient.query.filter_by(is_active=True).count()
        total_professionals = Professional.query.filter_by(is_active=True).count()
        total_appointments = Appointment.query.count()
        total_medical_records = MedicalRecord.query.count()

        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        new_patients = Patient.query.filter(
            Patient.created_at >= thirty_days_ago
        ).count()

        recent_appointments = Appointment.query.filter(
            Appointment.created_at >= thirty_days_ago
        ).count()

        # Appointment status distribution
        appointment_status = db.session.query(
            Appointment.status,
            func.count(Appointment.id).label('count')
        ).group_by(Appointment.status).all()

        status_distribution = {status: count for status, count in appointment_status}

        # Budget and payment summary
        total_budgets = Budget.query.count()
        total_payments = Payment.query.count()

        # Calculate total revenue
        total_revenue = db.session.query(
            func.sum(Payment.amount)
        ).filter(Payment.payment_status == 'completed').scalar() or Decimal('0.00')

        return jsonify({
            'totals': {
                'patients': total_patients,
                'professionals': total_professionals,
                'appointments': total_appointments,
                'medical_records': total_medical_records,
                'budgets': total_budgets,
                'payments': total_payments
            },
            'recent_activity': {
                'new_patients_30d': new_patients,
                'appointments_30d': recent_appointments
            },
            'appointment_status': status_distribution,
            'revenue': {
                'total': float(total_revenue),
                'currency': 'ARS'
            },
            'generated_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/appointments/stats', methods=['GET'])
@jwt_required()
def get_appointment_stats():
    """
    Get detailed appointment statistics

    Returns:
        JSON with appointment metrics
    """
    try:
        # Today's appointments
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        today_appointments = Appointment.query.filter(
            Appointment.appointment_date >= today_start,
            Appointment.appointment_date < today_end
        ).count()

        # This week
        week_start = today_start - timedelta(days=today_start.weekday())
        week_end = week_start + timedelta(days=7)

        week_appointments = Appointment.query.filter(
            Appointment.appointment_date >= week_start,
            Appointment.appointment_date < week_end
        ).count()

        # This month
        month_start = today_start.replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)

        month_appointments = Appointment.query.filter(
            Appointment.appointment_date >= month_start,
            Appointment.appointment_date < month_end
        ).count()

        # Completion rate (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        completed_appointments = Appointment.query.filter(
            Appointment.created_at >= thirty_days_ago,
            Appointment.status == 'completed'
        ).count()

        total_past_appointments = Appointment.query.filter(
            Appointment.created_at >= thirty_days_ago,
            Appointment.appointment_date < datetime.utcnow()
        ).count()

        completion_rate = (completed_appointments / total_past_appointments * 100) if total_past_appointments > 0 else 0

        # No-show rate
        no_show_appointments = Appointment.query.filter(
            Appointment.created_at >= thirty_days_ago,
            Appointment.status == 'no_show'
        ).count()

        no_show_rate = (no_show_appointments / total_past_appointments * 100) if total_past_appointments > 0 else 0

        # Top professionals by appointments
        top_professionals = db.session.query(
            Professional.id,
            Professional.first_name,
            Professional.last_name,
            Professional.specialty,
            func.count(Appointment.id).label('appointment_count')
        ).join(Appointment).filter(
            Appointment.created_at >= thirty_days_ago
        ).group_by(
            Professional.id,
            Professional.first_name,
            Professional.last_name,
            Professional.specialty
        ).order_by(
            func.count(Appointment.id).desc()
        ).limit(5).all()

        top_professionals_list = [
            {
                'id': prof.id,
                'name': f"{prof.first_name} {prof.last_name}",
                'specialty': prof.specialty,
                'appointments': prof.appointment_count
            }
            for prof in top_professionals
        ]

        return jsonify({
            'periods': {
                'today': today_appointments,
                'this_week': week_appointments,
                'this_month': month_appointments
            },
            'metrics': {
                'completion_rate': round(completion_rate, 2),
                'no_show_rate': round(no_show_rate, 2)
            },
            'top_professionals': top_professionals_list,
            'generated_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/revenue/stats', methods=['GET'])
@jwt_required()
def get_revenue_stats():
    """
    Get revenue and financial statistics

    Returns:
        JSON with financial metrics
    """
    try:
        # Total revenue by status
        revenue_by_status = db.session.query(
            Payment.payment_status,
            func.sum(Payment.amount).label('total'),
            func.count(Payment.id).label('count')
        ).group_by(Payment.payment_status).all()

        revenue_breakdown = {
            status: {
                'total': float(total),
                'count': count
            }
            for status, total, count in revenue_by_status
        }

        # Monthly revenue (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)

        # Use to_char for PostgreSQL compatibility
        monthly_revenue = db.session.query(
            format_year_month(Payment.payment_date).label('month'),
            func.sum(Payment.amount).label('total')
        ).filter(
            Payment.payment_date >= six_months_ago,
            Payment.payment_status == 'completed'
        ).group_by(
            format_year_month(Payment.payment_date)
        ).order_by(
            format_year_month(Payment.payment_date)
        ).all()

        monthly_data = [
            {
                'month': month if month else 'Unknown',
                'revenue': float(total)
            }
            for month, total in monthly_revenue
        ]

        # Average transaction value
        avg_payment = db.session.query(
            func.avg(Payment.amount)
        ).filter(Payment.payment_status == 'completed').scalar() or Decimal('0.00')

        # Pending payments
        pending_amount = db.session.query(
            func.sum(Payment.amount)
        ).filter(Payment.payment_status == 'pending').scalar() or Decimal('0.00')

        # Payment methods distribution
        payment_methods = db.session.query(
            Payment.payment_method,
            func.count(Payment.id).label('count'),
            func.sum(Payment.amount).label('total')
        ).filter(
            Payment.payment_status == 'completed'
        ).group_by(Payment.payment_method).all()

        methods_distribution = {
            method: {
                'count': count,
                'total': float(total)
            }
            for method, count, total in payment_methods
        }

        return jsonify({
            'revenue_by_status': revenue_breakdown,
            'monthly_revenue': monthly_data,
            'metrics': {
                'average_transaction': float(avg_payment),
                'pending_amount': float(pending_amount)
            },
            'payment_methods': methods_distribution,
            'generated_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/patients/stats', methods=['GET'])
@jwt_required()
def get_patient_stats():
    """
    Get patient statistics and demographics

    Returns:
        JSON with patient metrics
    """
    try:
        # Total active patients
        total_active = Patient.query.filter_by(is_active=True).count()
        total_inactive = Patient.query.filter_by(is_active=False).count()

        # New patients trend (last 12 months)
        twelve_months_ago = datetime.utcnow() - timedelta(days=365)

        # Use to_char for PostgreSQL compatibility
        monthly_new_patients = db.session.query(
            format_year_month(Patient.created_at).label('month'),
            func.count(Patient.id).label('count')
        ).filter(
            Patient.created_at >= twelve_months_ago
        ).group_by(
            format_year_month(Patient.created_at)
        ).order_by(
            format_year_month(Patient.created_at)
        ).all()

        monthly_data = [
            {
                'month': month if month else 'Unknown',
                'new_patients': count
            }
            for month, count in monthly_new_patients
        ]

        # Patients with medical records
        patients_with_records = db.session.query(
            func.count(func.distinct(MedicalRecord.patient_id))
        ).scalar() or 0

        # Average appointments per patient
        # Optimized: O(1) calculation instead of O(N) correlated subquery
        # This also fixes a bug where the previous query calculated total
        # appointments instead of average per patient.
        total_patients = total_active + total_inactive
        total_appointments = Appointment.query.count()

        if total_patients > 0:
            avg_appointments = total_appointments / total_patients
        else:
            avg_appointments = 0

        return jsonify({
            'totals': {
                'active': total_active,
                'inactive': total_inactive,
                'with_medical_records': patients_with_records
            },
            'monthly_new_patients': monthly_data,
            'metrics': {
                'avg_appointments_per_patient': round(float(avg_appointments), 2)
            },
            'generated_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/files/stats', methods=['GET'])
@jwt_required()
def get_files_stats():
    """
    Get file storage statistics

    Returns:
        JSON with file metrics
    """
    try:
        # Total files
        total_files = File.query.count()

        # Total storage used
        total_storage = db.session.query(
            func.sum(File.file_size)
        ).scalar() or 0

        # Files by type
        files_by_type = db.session.query(
            File.file_type,
            func.count(File.id).label('count'),
            func.sum(File.file_size).label('total_size')
        ).group_by(File.file_type).all()

        type_distribution = {
            file_type: {
                'count': count,
                'size_bytes': int(total_size),
                'size_mb': round(total_size / (1024 * 1024), 2)
            }
            for file_type, count, total_size in files_by_type
        }

        # Recent uploads (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_uploads = File.query.filter(
            File.created_at >= seven_days_ago
        ).count()

        return jsonify({
            'totals': {
                'files': total_files,
                'storage_bytes': int(total_storage),
                'storage_mb': round(total_storage / (1024 * 1024), 2),
                'storage_gb': round(total_storage / (1024 * 1024 * 1024), 2)
            },
            'files_by_type': type_distribution,
            'recent_uploads_7d': recent_uploads,
            'generated_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/activity/recent', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """
    Get recent system activity

    Returns:
        JSON with recent activity feed
    """
    try:
        # Recent appointments (last 10)
        recent_appointments = Appointment.query.order_by(
            Appointment.created_at.desc()
        ).limit(10).all()

        appointments_data = [
            {
                'id': apt.id,
                'patient_id': apt.patient_id,
                'professional_id': apt.professional_id,
                'date': apt.appointment_date.isoformat(),
                'status': apt.status,
                'created_at': apt.created_at.isoformat()
            }
            for apt in recent_appointments
        ]

        # Recent payments (last 10)
        recent_payments = Payment.query.order_by(
            Payment.created_at.desc()
        ).limit(10).all()

        payments_data = [
            {
                'id': pmt.id,
                'amount': float(pmt.amount),
                'status': pmt.payment_status,
                'method': pmt.payment_method,
                'created_at': pmt.created_at.isoformat()
            }
            for pmt in recent_payments
        ]

        # Recent file uploads (last 10)
        recent_files = File.query.order_by(
            File.created_at.desc()
        ).limit(10).all()

        files_data = [
            {
                'id': file.id,
                'filename': file.filename,
                'file_type': file.file_type,
                'size_mb': round(file.file_size / (1024 * 1024), 2),
                'created_at': file.created_at.isoformat()
            }
            for file in recent_files
        ]

        return jsonify({
            'recent_appointments': appointments_data,
            'recent_payments': payments_data,
            'recent_files': files_data,
            'generated_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
