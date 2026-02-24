# -*- coding: utf-8 -*-
"""
Dashboard and Analytics endpoints
Provides metrics and KPIs for the medical services platform
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.services.dashboard_service import DashboardService

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    """
    Get general overview metrics

    Returns:
        JSON with overall system statistics
    """
    try:
        return jsonify(DashboardService.get_overview()), 200
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
        return jsonify(DashboardService.get_appointment_stats()), 200
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
        return jsonify(DashboardService.get_revenue_stats()), 200
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
        return jsonify(DashboardService.get_patient_stats()), 200
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
        return jsonify(DashboardService.get_files_stats()), 200
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
        return jsonify(DashboardService.get_recent_activity()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
