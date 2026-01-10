# -*- coding: utf-8 -*-
"""
Reports Resource - Endpoints para generación de reportes
"""

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.report_service import ReportService
from app.utils.decorators import admin_required, professional_required
from datetime import datetime, timedelta
import io

blueprint = Blueprint('reports', __name__, url_prefix='/api/reports')


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
        return jsonify({'error': 'Paciente no encontrado'}), 404

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
        return jsonify({'error': 'start_date y end_date son requeridos'}), 400

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
        return jsonify({'error': 'Profesional no encontrado'}), 404

    return jsonify(report), 200


# ============ REPORTES FINANCIEROS ============

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
        return jsonify({'error': 'start_date y end_date son requeridos'}), 400

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
        return jsonify({'error': 'start_date y end_date son requeridos'}), 400

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
        return jsonify({'error': 'start_date y end_date son requeridos'}), 400

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

    return jsonify(report), 200


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
