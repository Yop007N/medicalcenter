# -*- coding: utf-8 -*-
"""
Reports Resource - Endpoints para generación de reportes
"""

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required
from app.resources.domain_errors import message_response
from app.services.report_service import ReportService
from app.utils.decorators import admin_required, professional_required
from app.extensions import db
from app.models.appointment import Appointment
from app.models.budget import Budget
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.professional import Professional
from datetime import datetime, timedelta
from sqlalchemy import and_, func
import io
import csv

blueprint = Blueprint('reports', __name__, url_prefix='/api/reports')


def _parse_date_range(default_days=30):
    """Parse optional date range from query args with fallback window."""
    start_date_arg = request.args.get('start_date')
    end_date_arg = request.args.get('end_date')

    if start_date_arg and end_date_arg:
        return (
            datetime.strptime(start_date_arg, '%Y-%m-%d'),
            datetime.strptime(end_date_arg, '%Y-%m-%d')
        )

    end_date = datetime.now()
    start_date = end_date - timedelta(days=default_days)
    return start_date, end_date


def _build_medical_summary_report(start_date, end_date, professional_id=None):
    filters = [
        MedicalRecord.created_at >= start_date,
        MedicalRecord.created_at <= end_date
    ]
    if professional_id:
        filters.append(MedicalRecord.professional_id == professional_id)

    total_records = MedicalRecord.query.filter(and_(*filters)).count()

    by_professional_rows = db.session.query(
        Professional.id,
        Professional.first_name,
        Professional.last_name,
        func.count(MedicalRecord.id)
    ).join(
        MedicalRecord,
        MedicalRecord.professional_id == Professional.id
    ).filter(
        and_(*filters)
    ).group_by(
        Professional.id,
        Professional.first_name,
        Professional.last_name
    ).all()

    by_specialty_rows = db.session.query(
        Professional.specialty,
        func.count(MedicalRecord.id)
    ).join(
        MedicalRecord,
        MedicalRecord.professional_id == Professional.id
    ).filter(
        and_(*filters)
    ).group_by(
        Professional.specialty
    ).all()

    return {
        'total_records': total_records,
        'by_professional': [
            {
                'professional_id': professional_id_row,
                'name': f'{first_name} {last_name}',
                'records_count': records_count
            }
            for professional_id_row, first_name, last_name, records_count in by_professional_rows
        ],
        'by_specialty': [
            {
                'specialty': specialty or 'Sin especialidad',
                'count': count
            }
            for specialty, count in by_specialty_rows
        ],
        'period': {
            'start': start_date.date().isoformat(),
            'end': end_date.date().isoformat()
        }
    }


def _build_financial_summary_report(start_date, end_date):
    revenue_report = ReportService.generate_revenue_report(start_date, end_date)
    budget_report = ReportService.generate_budget_report(start_date, end_date)

    payment_counts = {}
    for payment in revenue_report.get('payments', []):
        method = payment.get('method') or 'unknown'
        payment_counts[method] = payment_counts.get(method, 0) + 1

    by_payment_method = []
    for method, amount in revenue_report.get('by_payment_method', {}).items():
        by_payment_method.append({
            'method': method,
            'amount': float(amount),
            'count': payment_counts.get(method, 0)
        })

    by_month = {}
    for row in revenue_report.get('daily_revenue', []):
        date_value = datetime.fromisoformat(row['date'])
        month_key = date_value.strftime('%Y-%m')
        if month_key not in by_month:
            by_month[month_key] = {
                'month': month_key,
                'revenue': 0.0,
                'pending': 0.0
            }
        by_month[month_key]['revenue'] += float(row.get('amount', 0))

    pending_amount = 0.0
    for status_row in budget_report.get('by_status', []):
        if status_row.get('status') == 'pending':
            pending_amount += float(status_row.get('total_amount', 0))

    return {
        'total_revenue': float(revenue_report['summary'].get('total_revenue', 0)),
        'total_pending': pending_amount,
        'currency': 'PYG',
        'by_payment_method': by_payment_method,
        'by_month': list(by_month.values()),
        'period': {
            'start': start_date.date().isoformat(),
            'end': end_date.date().isoformat()
        }
    }


def _build_appointments_frontend_payload(report, start_date, end_date, professional_id=None, patient_id=None):
    filters = [
        Appointment.appointment_date >= start_date,
        Appointment.appointment_date <= end_date
    ]
    if professional_id:
        filters.append(Appointment.professional_id == professional_id)
    if patient_id:
        filters.append(Appointment.patient_id == patient_id)

    by_professional_rows = db.session.query(
        Professional.id,
        Professional.first_name,
        Professional.last_name,
        func.count(Appointment.id)
    ).join(
        Appointment,
        Appointment.professional_id == Professional.id
    ).filter(
        and_(*filters)
    ).group_by(
        Professional.id,
        Professional.first_name,
        Professional.last_name
    ).all()

    total_appointments = report['summary'].get('total_appointments', 0)
    cancelled = report['summary'].get('cancelled', 0)
    no_show = report['summary'].get('no_show', 0)

    status_map = report.get('by_status', {})
    status_list = [
        {'status': status, 'count': count}
        for status, count in status_map.items()
    ]

    return {
        'total_appointments': total_appointments,
        'by_status': status_list,
        'by_professional': [
            {
                'professional_id': professional_id_row,
                'name': f'{first_name} {last_name}',
                'appointments_count': appointments_count
            }
            for professional_id_row, first_name, last_name, appointments_count in by_professional_rows
        ],
        'cancellation_rate': (cancelled / total_appointments) if total_appointments else 0,
        'no_show_rate': (no_show / total_appointments) if total_appointments else 0,
        'period': {
            'start': start_date.date().isoformat(),
            'end': end_date.date().isoformat()
        },
        # Legacy keys for existing clients/tests
        'summary': report.get('summary', {}),
        'by_status_map': status_map,
        'by_type': report.get('by_type', {}),
        'by_weekday': report.get('by_weekday', {}),
        'daily_breakdown': report.get('daily_breakdown', [])
    }


# ============ REPORTES MÉDICOS ============

@blueprint.route('/medical/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_history_report(patient_id):
    """
    Genera reporte de historial médico de paciente
    ---
    tags:
      - Reports
    security:
      - Bearer: []
    parameters:
      - name: patient_id
        in: path
        type: integer
        required: true
      - name: start_date
        in: query
        type: string
        format: date
        description: Fecha inicio (YYYY-MM-DD)
      - name: end_date
        in: query
        type: string
        format: date
        description: Fecha fin (YYYY-MM-DD)
      - name: format
        in: query
        type: string
        enum: [json, csv]
        default: json
    responses:
      200:
        description: Reporte generado exitosamente
      404:
        description: Paciente no encontrado
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    format_type = request.args.get('format', 'json')

    # Convertir fechas
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')

    # Generar reporte
    report = ReportService.generate_patient_history_report(
        patient_id,
        start_date,
        end_date
    )

    if not report:
        return message_response('Paciente no encontrado', 404)

    # Exportar según formato
    if format_type == 'csv':
        csv_data = ReportService.export_to_csv(report, 'patient_history')
        return send_file(
            io.BytesIO(csv_data.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'patient_{patient_id}_history.csv'
        )

    return jsonify(report), 200


@blueprint.route('/medical/professional/<int:professional_id>', methods=['GET'])
@jwt_required()
@professional_required
def get_professional_activity_report(professional_id):
    """
    Genera reporte de actividad de profesional
    ---
    tags:
      - Reports
    security:
      - Bearer: []
    parameters:
      - name: professional_id
        in: path
        type: integer
        required: true
      - name: start_date
        in: query
        type: string
        format: date
        required: true
      - name: end_date
        in: query
        type: string
        format: date
        required: true
    responses:
      200:
        description: Reporte generado exitosamente
      400:
        description: Fechas requeridas
      404:
        description: Profesional no encontrado
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return message_response('start_date y end_date son requeridos', 400)

    # Convertir fechas
    start_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d')

    # Generar reporte
    report = ReportService.generate_professional_activity_report(
        professional_id,
        start_date,
        end_date
    )

    if not report:
        return message_response('Profesional no encontrado', 404)

    return jsonify(report), 200


@blueprint.route('/medical', methods=['GET'])
@jwt_required()
def get_medical_report_summary():
    """Frontend-compatible medical report summary."""
    professional_id = request.args.get('professional_id', type=int)
    start_date, end_date = _parse_date_range(default_days=30)

    data = _build_medical_summary_report(start_date, end_date, professional_id)
    return jsonify(data), 200


# ============ REPORTES FINANCIEROS ============

@blueprint.route('/financial', methods=['GET'])
@jwt_required()
def get_financial_report_summary():
    """Frontend-compatible financial report summary."""
    start_date, end_date = _parse_date_range(default_days=30)
    data = _build_financial_summary_report(start_date, end_date)
    return jsonify(data), 200

@blueprint.route('/financial/revenue', methods=['GET'])
@jwt_required()
@admin_required
def get_revenue_report():
    """
    Genera reporte de ingresos
    ---
    tags:
      - Reports
    security:
      - Bearer: []
    parameters:
      - name: start_date
        in: query
        type: string
        format: date
        required: true
      - name: end_date
        in: query
        type: string
        format: date
        required: true
      - name: professional_id
        in: query
        type: integer
        description: Filtrar por profesional
      - name: format
        in: query
        type: string
        enum: [json, csv]
        default: json
    responses:
      200:
        description: Reporte generado exitosamente
      400:
        description: Fechas requeridas
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    professional_id = request.args.get('professional_id', type=int)
    format_type = request.args.get('format', 'json')

    if not start_date or not end_date:
        return message_response('start_date y end_date son requeridos', 400)

    # Convertir fechas
    start_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d')

    # Generar reporte
    report = ReportService.generate_revenue_report(
        start_date,
        end_date,
        professional_id
    )

    # Exportar según formato
    if format_type == 'csv':
        csv_data = ReportService.export_to_csv(report, 'revenue')
        return send_file(
            io.BytesIO(csv_data.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='revenue_report.csv'
        )

    return jsonify(report), 200


@blueprint.route('/financial/budgets', methods=['GET'])
@jwt_required()
@admin_required
def get_budget_report():
    """
    Genera reporte de presupuestos
    ---
    tags:
      - Reports
    security:
      - Bearer: []
    parameters:
      - name: start_date
        in: query
        type: string
        format: date
        required: true
      - name: end_date
        in: query
        type: string
        format: date
        required: true
      - name: status
        in: query
        type: string
        enum: [pending, sent, accepted, rejected]
    responses:
      200:
        description: Reporte generado exitosamente
      400:
        description: Fechas requeridas
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')

    if not start_date or not end_date:
        return message_response('start_date y end_date son requeridos', 400)

    # Convertir fechas
    start_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d')

    # Generar reporte
    report = ReportService.generate_budget_report(
        start_date,
        end_date,
        status
    )

    return jsonify(report), 200


# ============ REPORTES DE AGENDA ============

@blueprint.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointment_report():
    """
    Genera reporte de turnos
    ---
    tags:
      - Reports
    security:
      - Bearer: []
    parameters:
      - name: start_date
        in: query
        type: string
        format: date
        required: true
      - name: end_date
        in: query
        type: string
        format: date
        required: true
      - name: professional_id
        in: query
        type: integer
        description: Filtrar por profesional
      - name: patient_id
        in: query
        type: integer
        description: Filtrar por paciente
      - name: format
        in: query
        type: string
        enum: [json, csv]
        default: json
    responses:
      200:
        description: Reporte generado exitosamente
      400:
        description: Fechas requeridas
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    professional_id = request.args.get('professional_id', type=int)
    patient_id = request.args.get('patient_id', type=int)
    format_type = request.args.get('format', 'json')

    if not start_date or not end_date:
        return message_response('start_date y end_date son requeridos', 400)

    # Convertir fechas
    start_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d')

    # Generar reporte
    report = ReportService.generate_appointment_report(
        start_date,
        end_date,
        professional_id,
        patient_id
    )

    # Exportar según formato
    if format_type == 'csv':
        csv_data = ReportService.export_to_csv(report, 'appointments')
        return send_file(
            io.BytesIO(csv_data.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='appointments_report.csv'
        )

    frontend_payload = _build_appointments_frontend_payload(
        report,
        start_date,
        end_date,
        professional_id=professional_id,
        patient_id=patient_id
    )
    return jsonify(frontend_payload), 200


# ============ REPORTES PREDEFINIDOS ============

@blueprint.route('/quick/monthly', methods=['GET'])
@jwt_required()
@admin_required
def get_monthly_summary():
    """
    Genera resumen mensual rápido
    ---
    tags:
      - Reports
    security:
      - Bearer: []
    parameters:
      - name: month
        in: query
        type: integer
        description: Mes (1-12), default mes actual
      - name: year
        in: query
        type: integer
        description: Año, default año actual
    responses:
      200:
        description: Resumen mensual generado
    """
    month = request.args.get('month', type=int) or datetime.now().month
    year = request.args.get('year', type=int) or datetime.now().year

    # Calcular primer y último día del mes
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(days=1)

    # Generar reportes
    appointments = ReportService.generate_appointment_report(start_date, end_date)
    revenue = ReportService.generate_revenue_report(start_date, end_date)
    budgets = ReportService.generate_budget_report(start_date, end_date)

    return jsonify({
        'period': {
            'month': month,
            'year': year,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'appointments': appointments['summary'],
        'revenue': revenue['summary'],
        'budgets': budgets['summary']
    }), 200


@blueprint.route('/quick/weekly', methods=['GET'])
@jwt_required()
def get_weekly_summary():
    """
    Genera resumen semanal rápido
    ---
    tags:
      - Reports
    security:
      - Bearer: []
    responses:
      200:
        description: Resumen semanal generado
    """
    # Última semana
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)

    # Generar reporte de turnos
    appointments = ReportService.generate_appointment_report(start_date, end_date)

    return jsonify({
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'days': 7
        },
        'appointments': appointments['summary'],
        'by_status': appointments['by_status'],
        'by_weekday': appointments['by_weekday'],
        'daily_breakdown': appointments['daily_breakdown']
    }), 200


@blueprint.route('/quick/stats', methods=['GET'])
@jwt_required()
def get_quick_stats():
    """Frontend-compatible quick stats."""
    now = datetime.now()
    start_today = datetime(now.year, now.month, now.day)
    end_today = start_today + timedelta(days=1)
    month_start = datetime(now.year, now.month, 1)

    today_appointments = Appointment.query.filter(
        Appointment.appointment_date >= start_today,
        Appointment.appointment_date < end_today
    ).count()

    pending_budgets = Budget.query.filter(
        Budget.status == 'pending'
    ).count()

    new_patients_this_month = Patient.query.filter(
        Patient.created_at >= month_start
    ).count()

    revenue_this_month = ReportService.generate_revenue_report(
        month_start,
        now
    )['summary'].get('total_revenue', 0)

    return jsonify({
        'today_appointments': today_appointments,
        'pending_budgets': pending_budgets,
        'new_patients_this_month': new_patients_this_month,
        'revenue_this_month': float(revenue_this_month)
    }), 200


@blueprint.route('/<string:report_type>/export', methods=['GET'])
@jwt_required()
def export_frontend_report(report_type):
    """Generic export endpoint used by frontend reports module."""
    start_date, end_date = _parse_date_range(default_days=30)
    professional_id = request.args.get('professional_id', type=int)
    patient_id = request.args.get('patient_id', type=int)

    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == 'financial':
        report = ReportService.generate_revenue_report(start_date, end_date, professional_id)
        writer.writerow(['date', 'amount', 'method', 'budget_id'])
        for payment in report.get('payments', []):
            writer.writerow([payment['date'], payment['amount'], payment['method'], payment['budget_id']])
    elif report_type == 'appointments':
        report = ReportService.generate_appointment_report(
            start_date,
            end_date,
            professional_id,
            patient_id
        )
        writer.writerow(['status', 'count'])
        for status, count in report.get('by_status', {}).items():
            writer.writerow([status, count])
    elif report_type == 'medical':
        report = _build_medical_summary_report(start_date, end_date, professional_id)
        writer.writerow(['total_records', report['total_records']])
        writer.writerow([])
        writer.writerow(['specialty', 'count'])
        for item in report.get('by_specialty', []):
            writer.writerow([item['specialty'], item['count']])
    else:
        return jsonify({'msg': 'Unsupported report_type'}), 400

    payload = output.getvalue().encode('utf-8')
    output.close()
    return send_file(
        io.BytesIO(payload),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'reporte_{report_type}_{datetime.now().strftime("%Y%m%d")}.csv'
    )
