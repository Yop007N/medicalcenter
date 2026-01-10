# -*- coding: utf-8 -*-
"""
Test all API endpoints
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000/api"

def print_result(endpoint, method, status_code, response):
    """Print test result"""
    status_symbol = "[OK]" if 200 <= status_code < 300 else "[FAIL]"
    print(f"\n{status_symbol} {method} {endpoint}")
    print(f"   Status: {status_code}")
    if isinstance(response, dict):
        print(f"   Response: {json.dumps(response, indent=2)[:200]}...")
    else:
        print(f"   Response: {str(response)[:200]}...")

def test_authentication():
    """Test authentication endpoints"""
    print("\n" + "="*60)
    print("TESTING AUTHENTICATION ENDPOINTS")
    print("="*60)

    # Test 1: Login with admin
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@medical.com", "password": "admin123"}
    )
    print_result("/auth/login", "POST", response.status_code, response.json())

    if response.status_code == 200:
        global access_token, refresh_token
        data = response.json()
        access_token = data['access_token']
        refresh_token = data['refresh_token']
        print(f"\n   > Access Token: {access_token[:50]}...")
        print(f"   > Refresh Token: {refresh_token[:50]}...")

    # Test 2: Register new user
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": f"newuser_{datetime.now().timestamp()}@medical.com",
            "password": "password123",
            "first_name": "New",
            "last_name": "User",
            "role": "patient"
        }
    )
    print_result("/auth/register", "POST", response.status_code, response.json())

    # Test 3: Refresh token
    if refresh_token:
        response = requests.post(
            f"{BASE_URL}/auth/refresh",
            headers={"Authorization": f"Bearer {refresh_token}"}
        )
        print_result("/auth/refresh", "POST", response.status_code, response.json())

def test_users():
    """Test users endpoints"""
    print("\n" + "="*60)
    print("TESTING USERS ENDPOINTS")
    print("="*60)

    headers = {"Authorization": f"Bearer {access_token}"}

    # Test 1: List all users
    response = requests.get(f"{BASE_URL}/users", headers=headers)
    print_result("/users", "GET", response.status_code, response.json())

    # Test 2: Get specific user
    response = requests.get(f"{BASE_URL}/users/1", headers=headers)
    print_result("/users/1", "GET", response.status_code, response.json())

    # Test 3: Create new user
    response = requests.post(
        f"{BASE_URL}/users",
        headers=headers,
        json={
            "email": f"apitest_{datetime.now().timestamp()}@medical.com",
            "password": "test123",
            "first_name": "API",
            "last_name": "Test",
            "role": "patient"
        }
    )
    print_result("/users", "POST", response.status_code, response.json())

    if response.status_code == 201:
        user_id = response.json()['id']

        # Test 4: Update user
        response = requests.put(
            f"{BASE_URL}/users/{user_id}",
            headers=headers,
            json={"first_name": "Updated"}
        )
        print_result(f"/users/{user_id}", "PUT", response.status_code, response.json())

        # Test 5: Delete user
        response = requests.delete(f"{BASE_URL}/users/{user_id}", headers=headers)
        print_result(f"/users/{user_id}", "DELETE", response.status_code, response.json() if response.text else "Success")

def test_professionals():
    """Test professionals endpoints"""
    print("\n" + "="*60)
    print("TESTING PROFESSIONALS ENDPOINTS")
    print("="*60)

    headers = {"Authorization": f"Bearer {access_token}"}

    # Test 1: List all professionals
    response = requests.get(f"{BASE_URL}/professionals", headers=headers)
    print_result("/professionals", "GET", response.status_code, response.json())

    # Test 2: Get specific professional
    response = requests.get(f"{BASE_URL}/professionals/2", headers=headers)
    print_result("/professionals/2", "GET", response.status_code, response.json())

    # Test 3: Get professional's appointments
    response = requests.get(f"{BASE_URL}/professionals/2/appointments", headers=headers)
    print_result("/professionals/2/appointments", "GET", response.status_code, response.json())

def test_patients():
    """Test patients endpoints"""
    print("\n" + "="*60)
    print("TESTING PATIENTS ENDPOINTS")
    print("="*60)

    headers = {"Authorization": f"Bearer {access_token}"}

    # Test 1: List all patients
    response = requests.get(f"{BASE_URL}/patients", headers=headers)
    print_result("/patients", "GET", response.status_code, response.json())

    # Test 2: Get specific patient
    response = requests.get(f"{BASE_URL}/patients/3", headers=headers)
    print_result("/patients/3", "GET", response.status_code, response.json())

    # Test 3: Get patient's medical history
    response = requests.get(f"{BASE_URL}/patients/3/medical-history", headers=headers)
    print_result("/patients/3/medical-history", "GET", response.status_code, response.json())

def test_appointments():
    """Test appointments endpoints"""
    print("\n" + "="*60)
    print("TESTING APPOINTMENTS ENDPOINTS")
    print("="*60)

    headers = {"Authorization": f"Bearer {access_token}"}

    # Test 1: List all appointments
    response = requests.get(f"{BASE_URL}/appointments", headers=headers)
    print_result("/appointments", "GET", response.status_code, response.json())

    # Test 2: Create new appointment
    appointment_date = (datetime.now() + timedelta(days=1)).isoformat()
    response = requests.post(
        f"{BASE_URL}/appointments",
        headers=headers,
        json={
            "patient_id": 3,
            "professional_id": 2,
            "appointment_date": appointment_date,
            "duration_minutes": 30,
            "appointment_type": "consultation",
            "reason": "Check-up"
        }
    )
    print_result("/appointments", "POST", response.status_code, response.json())

    if response.status_code == 201:
        appointment_id = response.json()['id']

        # Test 3: Get specific appointment
        response = requests.get(f"{BASE_URL}/appointments/{appointment_id}", headers=headers)
        print_result(f"/appointments/{appointment_id}", "GET", response.status_code, response.json())

        # Test 4: Update appointment
        response = requests.put(
            f"{BASE_URL}/appointments/{appointment_id}",
            headers=headers,
            json={"notes": "Updated notes"}
        )
        print_result(f"/appointments/{appointment_id}", "PUT", response.status_code, response.json())

        # Test 5: Cancel appointment
        response = requests.delete(f"{BASE_URL}/appointments/{appointment_id}", headers=headers)
        print_result(f"/appointments/{appointment_id}", "DELETE", response.status_code, response.json() if response.text else "Success")

def test_medical_records():
    """Test medical records endpoints"""
    print("\n" + "="*60)
    print("TESTING MEDICAL RECORDS ENDPOINTS")
    print("="*60)

    headers = {"Authorization": f"Bearer {access_token}"}

    # Test 1: List all medical records
    response = requests.get(f"{BASE_URL}/medical-records", headers=headers)
    print_result("/medical-records", "GET", response.status_code, response.json())

    # Test 2: Create new medical record
    response = requests.post(
        f"{BASE_URL}/medical-records",
        headers=headers,
        json={
            "patient_id": 3,
            "professional_id": 2,
            "record_date": datetime.now().isoformat(),
            "chief_complaint": "Headache",
            "diagnosis": "Tension headache",
            "treatment": "Rest and hydration"
        }
    )
    print_result("/medical-records", "POST", response.status_code, response.json())

def test_budgets():
    """Test budgets endpoints"""
    print("\n" + "="*60)
    print("TESTING BUDGETS ENDPOINTS")
    print("="*60)

    headers = {"Authorization": f"Bearer {access_token}"}

    # Test 1: List all budgets
    response = requests.get(f"{BASE_URL}/budgets", headers=headers)
    print_result("/budgets", "GET", response.status_code, response.json())

def test_payments():
    """Test payments endpoints"""
    print("\n" + "="*60)
    print("TESTING PAYMENTS ENDPOINTS")
    print("="*60)

    headers = {"Authorization": f"Bearer {access_token}"}

    # Test 1: List all payments
    response = requests.get(f"{BASE_URL}/payments", headers=headers)
    print_result("/payments", "GET", response.status_code, response.json())

def test_sync():
    """Test sync endpoints"""
    print("\n" + "="*60)
    print("TESTING SYNC ENDPOINTS")
    print("="*60)

    headers = {"Authorization": f"Bearer {access_token}"}

    # Test 1: Get sync status
    response = requests.get(f"{BASE_URL}/sync/status", headers=headers)
    print_result("/sync/status", "GET", response.status_code, response.json())

    # Test 2: Get sync logs
    response = requests.get(f"{BASE_URL}/sync/logs", headers=headers)
    print_result("/sync/logs", "GET", response.status_code, response.json())

if __name__ == '__main__':
    access_token = None
    refresh_token = None

    print("\n" + "="*60)
    print("MEDICAL SERVICES API - ENDPOINT TESTS")
    print("="*60)

    try:
        # Run all tests
        test_authentication()
        test_users()
        test_professionals()
        test_patients()
        test_appointments()
        test_medical_records()
        test_budgets()
        test_payments()
        test_sync()

        print("\n" + "="*60)
        print("ALL TESTS COMPLETED!")
        print("="*60)

    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
