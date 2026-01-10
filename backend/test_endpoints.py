#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para probar todos los endpoints de la API Medical Services
Ejecutar con: python test_endpoints.py
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:5000"

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def ok(msg):
    print(f"{Colors.GREEN}[OK]{Colors.END} {msg}")

def fail(msg):
    print(f"{Colors.RED}[FAIL]{Colors.END} {msg}")

def info(msg):
    print(f"{Colors.BLUE}[INFO]{Colors.END} {msg}")

def section(msg):
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{'='*60}")
    print(f" {msg}")
    print(f"{'='*60}{Colors.END}\n")

# Contadores
results = {"passed": 0, "failed": 0, "errors": []}

def test_endpoint(method, endpoint, expected_status, headers=None, json_data=None, description=""):
    """Prueba un endpoint y reporta el resultado"""
    global results
    url = f"{BASE_URL}{endpoint}"

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=json_data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=json_data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)

        if response.status_code == expected_status:
            ok(f"{method} {endpoint} -> {response.status_code} {description}")
            results["passed"] += 1
            return response
        else:
            fail(f"{method} {endpoint} -> {response.status_code} (expected {expected_status}) {description}")
            results["failed"] += 1
            results["errors"].append(f"{method} {endpoint}: got {response.status_code}, expected {expected_status}")
            return response

    except Exception as e:
        fail(f"{method} {endpoint} -> ERROR: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"{method} {endpoint}: {str(e)}")
        return None

def main():
    print(f"\n{Colors.BOLD}Medical Services API - Test de Endpoints{Colors.END}")
    print(f"URL Base: {BASE_URL}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # ===========================================
    section("1. HEALTH CHECK")
    # ===========================================
    test_endpoint("GET", "/health", 200, description="Health check")

    # ===========================================
    section("2. AUTHENTICATION")
    # ===========================================

    # Login como admin
    info("Login como admin@medical.com")
    response = test_endpoint("POST", "/api/auth/login", 200,
        json_data={"email": "admin@medical.com", "password": "admin123"},
        description="Admin login")

    admin_token = None
    if response and response.status_code == 200:
        data = response.json()
        admin_token = data.get("access_token")
        admin_refresh = data.get("refresh_token")
        info(f"Token obtenido: {admin_token[:50]}...")

    # Login como doctor
    info("Login como doctor@medical.com")
    response = test_endpoint("POST", "/api/auth/login", 200,
        json_data={"email": "doctor@medical.com", "password": "doctor123"},
        description="Doctor login")

    doctor_token = None
    if response and response.status_code == 200:
        doctor_token = response.json().get("access_token")

    # Login como patient
    info("Login como patient@medical.com")
    response = test_endpoint("POST", "/api/auth/login", 200,
        json_data={"email": "patient@medical.com", "password": "patient123"},
        description="Patient login")

    patient_token = None
    if response and response.status_code == 200:
        patient_token = response.json().get("access_token")

    # Login incorrecto
    test_endpoint("POST", "/api/auth/login", 401,
        json_data={"email": "admin@medical.com", "password": "wrongpassword"},
        description="Invalid login")

    # Headers con auth
    admin_headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"} if doctor_token else {}
    patient_headers = {"Authorization": f"Bearer {patient_token}"} if patient_token else {}

    # Refresh token
    if admin_refresh:
        test_endpoint("POST", "/api/auth/refresh", 200,
            headers={"Authorization": f"Bearer {admin_refresh}"},
            description="Refresh token")

    # ===========================================
    section("3. PATIENTS")
    # ===========================================

    test_endpoint("GET", "/api/patients", 200, headers=admin_headers, description="List patients")
    test_endpoint("GET", "/api/patients/3", 200, headers=admin_headers, description="Get patient")
    test_endpoint("GET", "/api/patients/999", 404, headers=admin_headers, description="Patient not found")
    test_endpoint("GET", "/api/patients", 401, description="List patients unauthorized")
    test_endpoint("GET", "/api/patients/3/medical-history", 200, headers=admin_headers, description="Patient medical history")

    # Crear paciente
    new_patient_data = {
        "email": f"test_patient_{datetime.now().timestamp()}@test.com",
        "password": "Test123456",
        "first_name": "Test",
        "last_name": "Patient",
        "phone": "+5491112345678"
    }
    response = test_endpoint("POST", "/api/patients", 201, headers=admin_headers,
        json_data=new_patient_data, description="Create patient")

    new_patient_id = None
    if response and response.status_code == 201:
        new_patient_id = response.json().get("id")
        info(f"Paciente creado con ID: {new_patient_id}")

    # ===========================================
    section("4. PROFESSIONALS")
    # ===========================================

    test_endpoint("GET", "/api/professionals", 200, headers=admin_headers, description="List professionals")
    test_endpoint("GET", "/api/professionals/2", 200, headers=admin_headers, description="Get professional")
    test_endpoint("GET", "/api/professionals/999", 404, headers=admin_headers, description="Professional not found")
    test_endpoint("GET", "/api/professionals", 401, description="List professionals unauthorized")
    test_endpoint("GET", "/api/professionals/2/appointments", 200, headers=admin_headers, description="Professional appointments")

    # Crear profesional
    new_prof_data = {
        "email": f"test_prof_{datetime.now().timestamp()}@test.com",
        "password": "Test123456",
        "first_name": "Test",
        "last_name": "Professional",
        "license_number": f"LIC-{int(datetime.now().timestamp())}",
        "specialty": "General"
    }
    response = test_endpoint("POST", "/api/professionals", 201, headers=admin_headers,
        json_data=new_prof_data, description="Create professional")

    new_prof_id = None
    if response and response.status_code == 201:
        new_prof_id = response.json().get("id")
        info(f"Profesional creado con ID: {new_prof_id}")

    # ===========================================
    section("5. APPOINTMENTS")
    # ===========================================

    test_endpoint("GET", "/api/appointments", 200, headers=admin_headers, description="List appointments")
    test_endpoint("GET", "/api/appointments", 401, description="List appointments unauthorized")
    test_endpoint("GET", "/api/appointments/calendar?professional_id=2&date_from=2025-12-01&date_to=2025-12-31", 200,
        headers=admin_headers, description="Calendar view")

    # Crear cita (usando timestamp unico para evitar conflictos)
    appointment_date = (datetime.now() + timedelta(days=14, hours=int(datetime.now().timestamp()) % 8)).strftime("%Y-%m-%dT%H:00:00")
    new_appointment_data = {
        "patient_id": 3,
        "professional_id": 2,
        "appointment_date": appointment_date,
        "duration_minutes": 30,
        "appointment_type": "consultation",
        "reason": "Test appointment"
    }
    response = test_endpoint("POST", "/api/appointments", 201, headers=admin_headers,
        json_data=new_appointment_data, description="Create appointment")

    new_appointment_id = None
    if response and response.status_code == 201:
        new_appointment_id = response.json().get("id")
        info(f"Cita creada con ID: {new_appointment_id}")

        # Probar obtener y actualizar la cita
        test_endpoint("GET", f"/api/appointments/{new_appointment_id}", 200,
            headers=admin_headers, description="Get appointment")
        test_endpoint("PUT", f"/api/appointments/{new_appointment_id}", 200,
            headers=admin_headers, json_data={"notes": "Updated notes"},
            description="Update appointment")
        test_endpoint("POST", f"/api/appointments/{new_appointment_id}/confirm", 200,
            headers=admin_headers, description="Confirm appointment")

    # ===========================================
    section("6. MEDICAL RECORDS")
    # ===========================================

    test_endpoint("GET", "/api/medical-records", 200, headers=admin_headers, description="List medical records")
    test_endpoint("GET", "/api/medical-records", 401, description="List medical records unauthorized")

    # Crear registro medico
    new_record_data = {
        "patient_id": 3,
        "professional_id": 2,
        "chief_complaint": "Test complaint",
        "symptoms": "Test symptoms",
        "diagnosis": "Test diagnosis",
        "treatment": "Test treatment"
    }
    response = test_endpoint("POST", "/api/medical-records", 201, headers=doctor_headers,
        json_data=new_record_data, description="Create medical record")

    new_record_id = None
    if response and response.status_code == 201:
        new_record_id = response.json().get("id")
        info(f"Registro medico creado con ID: {new_record_id}")

        test_endpoint("GET", f"/api/medical-records/{new_record_id}", 200,
            headers=admin_headers, description="Get medical record")
        test_endpoint("PUT", f"/api/medical-records/{new_record_id}", 200,
            headers=doctor_headers, json_data={"notes": "Updated notes"},
            description="Update medical record")

    # ===========================================
    section("7. BUDGETS")
    # ===========================================

    test_endpoint("GET", "/api/budgets", 200, headers=admin_headers, description="List budgets")
    test_endpoint("GET", "/api/budgets", 401, description="List budgets unauthorized")

    # Crear presupuesto
    new_budget_data = {
        "patient_id": 3,
        "title": "Test Budget",
        "description": "Test budget description",
        "total_amount": 1000.00,
        "currency": "ARS",
        "items": [{"name": "Item 1", "price": 500}, {"name": "Item 2", "price": 500}]
    }
    response = test_endpoint("POST", "/api/budgets", 201, headers=doctor_headers,
        json_data=new_budget_data, description="Create budget")

    new_budget_id = None
    if response and response.status_code == 201:
        new_budget_id = response.json().get("id")
        info(f"Presupuesto creado con ID: {new_budget_id}")

        test_endpoint("GET", f"/api/budgets/{new_budget_id}", 200,
            headers=admin_headers, description="Get budget")
        test_endpoint("POST", f"/api/budgets/{new_budget_id}/send", 200,
            headers=doctor_headers, description="Send budget")

    # ===========================================
    section("8. PAYMENTS")
    # ===========================================

    test_endpoint("GET", "/api/payments", 200, headers=admin_headers, description="List payments")
    test_endpoint("GET", "/api/payments", 401, description="List payments unauthorized")

    if new_budget_id:
        new_payment_data = {
            "budget_id": new_budget_id,
            "amount": 500.00,
            "currency": "ARS",
            "payment_method": "cash"
        }
        response = test_endpoint("POST", "/api/payments", 201, headers=admin_headers,
            json_data=new_payment_data, description="Create payment")

        if response and response.status_code == 201:
            new_payment_id = response.json().get("id")
            info(f"Pago creado con ID: {new_payment_id}")

            test_endpoint("GET", f"/api/payments/{new_payment_id}", 200,
                headers=admin_headers, description="Get payment")

    # ===========================================
    section("9. ODONTOGRAMS")
    # ===========================================

    # Crear odontograma primero (el GET patient puede retornar 404 si no existe)
    new_odontogram_data = {
        "patient_id": 3,
        "notes": "Test odontogram"
    }
    response = test_endpoint("POST", "/api/odontograms", 201, headers=doctor_headers,
        json_data=new_odontogram_data, description="Create odontogram")

    new_odontogram_id = None
    if response and response.status_code == 201:
        new_odontogram_id = response.json().get("id")
        info(f"Odontograma creado con ID: {new_odontogram_id}")

        test_endpoint("GET", f"/api/odontograms/{new_odontogram_id}", 200,
            headers=admin_headers, description="Get odontogram")
        test_endpoint("GET", "/api/odontograms/patient/3", 200, headers=admin_headers,
            description="Patient odontograms")

        # Agregar diente
        tooth_data = {"tooth_number": 11, "status": "healthy"}
        test_endpoint("POST", f"/api/odontograms/{new_odontogram_id}/tooth", 201,
            headers=doctor_headers, json_data=tooth_data, description="Add tooth")
        test_endpoint("GET", f"/api/odontograms/{new_odontogram_id}/teeth", 200,
            headers=admin_headers, description="Get teeth")

    # ===========================================
    section("10. DENTAL TREATMENTS")
    # ===========================================

    test_endpoint("GET", "/api/dental-treatments", 200, headers=admin_headers,
        description="List dental treatments")

    # Crear tratamiento dental
    new_treatment_data = {
        "patient_id": 3,
        "treatment_type": "filling",
        "affected_teeth": [11, 12],
        "description": "Test treatment",
        "treatment_date": datetime.now().strftime("%Y-%m-%d")
    }
    response = test_endpoint("POST", "/api/dental-treatments", 201, headers=doctor_headers,
        json_data=new_treatment_data, description="Create dental treatment")

    if response and response.status_code == 201:
        new_treatment_id = response.json().get("id")
        info(f"Tratamiento dental creado con ID: {new_treatment_id}")

        test_endpoint("GET", f"/api/dental-treatments/{new_treatment_id}", 200,
            headers=admin_headers, description="Get dental treatment")
        test_endpoint("GET", "/api/dental-treatments/patient/3/history", 200,
            headers=admin_headers, description="Patient treatment history")

    # ===========================================
    section("11. DASHBOARD")
    # ===========================================

    test_endpoint("GET", "/api/dashboard/overview", 200, headers=admin_headers, description="Dashboard overview")
    test_endpoint("GET", "/api/dashboard/appointments/stats", 200, headers=admin_headers, description="Appointments stats")
    test_endpoint("GET", "/api/dashboard/revenue/stats", 200, headers=admin_headers, description="Revenue stats")
    test_endpoint("GET", "/api/dashboard/patients/stats", 200, headers=admin_headers, description="Patients stats")
    test_endpoint("GET", "/api/dashboard/files/stats", 200, headers=admin_headers, description="Files stats")
    test_endpoint("GET", "/api/dashboard/activity/recent", 200, headers=admin_headers, description="Recent activity")
    test_endpoint("GET", "/api/dashboard/overview", 401, description="Dashboard unauthorized")

    # ===========================================
    section("12. REPORTS")
    # ===========================================

    test_endpoint("GET", "/api/reports/medical/patient/3", 200, headers=admin_headers,
        description="Patient medical report")
    test_endpoint("GET", "/api/reports/medical/professional/2?start_date=2025-01-01&end_date=2025-12-31", 200,
        headers=admin_headers, description="Professional medical report")
    test_endpoint("GET", "/api/reports/financial/revenue?start_date=2025-01-01&end_date=2025-12-31", 200,
        headers=admin_headers, description="Revenue report")
    test_endpoint("GET", "/api/reports/financial/budgets?start_date=2025-01-01&end_date=2025-12-31", 200,
        headers=admin_headers, description="Budgets report")
    test_endpoint("GET", "/api/reports/appointments?start_date=2025-01-01&end_date=2025-12-31", 200,
        headers=admin_headers, description="Appointments report")
    test_endpoint("GET", "/api/reports/quick/monthly", 200, headers=admin_headers,
        description="Monthly quick report")
    test_endpoint("GET", "/api/reports/quick/weekly", 200, headers=admin_headers,
        description="Weekly quick report")

    # ===========================================
    section("13. AUDIT")
    # ===========================================

    test_endpoint("GET", "/api/audit/logs", 200, headers=admin_headers, description="List audit logs")
    test_endpoint("GET", "/api/audit/logs", 401, description="Audit logs unauthorized")
    test_endpoint("GET", "/api/audit/entity/patient/3/history", 200, headers=admin_headers,
        description="Entity history")
    test_endpoint("GET", "/api/audit/user/1/activity", 200, headers=admin_headers,
        description="User activity")
    test_endpoint("GET", "/api/audit/compliance/report?start_date=2025-01-01&end_date=2025-12-31", 200,
        headers=admin_headers, description="Compliance report")

    # ===========================================
    section("14. PSYCHOLOGY")
    # ===========================================

    # Crear evaluacion psicologica
    new_psych_eval_data = {
        "patient_id": 3,
        "reason": "Test evaluation",
        "primary_diagnosis": "Test diagnosis",
        "treatment_recommendations": "Test recommendations",
        "evaluation_date": datetime.now().strftime("%Y-%m-%d")
    }
    response = test_endpoint("POST", "/api/psychology/evaluations", 201, headers=doctor_headers,
        json_data=new_psych_eval_data, description="Create psych evaluation")

    psych_eval_id = None
    if response and response.status_code == 201:
        psych_eval_id = response.json().get("id")
        info(f"Evaluacion psicologica creada con ID: {psych_eval_id}")

        test_endpoint("GET", f"/api/psychology/evaluations/{psych_eval_id}", 200,
            headers=admin_headers, description="Get psych evaluation")
        test_endpoint("GET", "/api/psychology/evaluations/patient/3", 200,
            headers=admin_headers, description="Patient psych evaluations")

    # ===========================================
    section("15. PSYCHOPEDAGOGY")
    # ===========================================

    # Crear evaluacion psicopedagogica
    new_psychoped_eval_data = {
        "patient_id": 3,
        "reason": "Test evaluation",
        "recommendations": "Test recommendations",
        "evaluation_date": datetime.now().strftime("%Y-%m-%d")
    }
    response = test_endpoint("POST", "/api/psychopedagogy/evaluations", 201, headers=doctor_headers,
        json_data=new_psychoped_eval_data, description="Create psychoped evaluation")

    if response and response.status_code == 201:
        psychoped_eval_id = response.json().get("id")
        info(f"Evaluacion psicopedagogica creada con ID: {psychoped_eval_id}")

        test_endpoint("GET", f"/api/psychopedagogy/evaluations/{psychoped_eval_id}", 200,
            headers=admin_headers, description="Get psychoped evaluation")
        test_endpoint("GET", "/api/psychopedagogy/evaluations/patient/3", 200,
            headers=admin_headers, description="Patient psychoped evaluations")

    # ===========================================
    section("RESUMEN")
    # ===========================================

    total = results["passed"] + results["failed"]
    print(f"\n{Colors.BOLD}Resultados:{Colors.END}")
    print(f"  {Colors.GREEN}Pasaron: {results['passed']}{Colors.END}")
    print(f"  {Colors.RED}Fallaron: {results['failed']}{Colors.END}")
    print(f"  Total: {total}")
    print(f"  Porcentaje exito: {(results['passed']/total*100):.1f}%")

    if results["errors"]:
        print(f"\n{Colors.RED}Errores encontrados:{Colors.END}")
        for error in results["errors"]:
            print(f"  - {error}")

    print(f"\n{'='*60}")

    return results["failed"] == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
