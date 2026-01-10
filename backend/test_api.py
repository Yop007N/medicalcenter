# -*- coding: utf-8 -*-
"""
API Testing Script
Quick script to test API endpoints
"""

import requests
import json

BASE_URL = 'http://localhost:5000/api'

def test_login():
    """Test login endpoint"""
    print("\n" + "="*50)
    print("Testing Login...")
    print("="*50)

    response = requests.post(
        f'{BASE_URL}/auth/login',
        json={
            'email': 'admin@medical.com',
            'password': 'admin123'
        }
    )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Access Token: {data['access_token'][:50]}...")
        print(f"User: {data['user']['first_name']} {data['user']['last_name']}")
        print(f"Role: {data['user']['role']}")
        return data['access_token']
    else:
        print(f"Error: {response.json()}")
        return None


def test_get_users(token):
    """Test get users endpoint"""
    print("\n" + "="*50)
    print("Testing Get Users...")
    print("="*50)

    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/users', headers=headers)

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        users = response.json()
        print(f"Total users: {len(users)}")
        for user in users:
            print(f"  - {user['first_name']} {user['last_name']} ({user['role']})")
    else:
        print(f"Error: {response.json()}")


def test_get_professionals(token):
    """Test get professionals endpoint"""
    print("\n" + "="*50)
    print("Testing Get Professionals...")
    print("="*50)

    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/professionals', headers=headers)

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        professionals = response.json()
        print(f"Total professionals: {len(professionals)}")
        for prof in professionals:
            print(f"  - Dr. {prof['first_name']} {prof['last_name']}")
            print(f"    Specialty: {prof.get('specialty', 'N/A')}")
            print(f"    License: {prof.get('license_number', 'N/A')}")
    else:
        print(f"Error: {response.json()}")


def test_get_patients(token):
    """Test get patients endpoint"""
    print("\n" + "="*50)
    print("Testing Get Patients...")
    print("="*50)

    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/patients', headers=headers)

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        patients = response.json()
        print(f"Total patients: {len(patients)}")
        for patient in patients:
            print(f"  - {patient['first_name']} {patient['last_name']}")
            print(f"    Email: {patient['email']}")
    else:
        print(f"Error: {response.json()}")


def run_tests():
    """Run all API tests"""
    print("\n" + "#"*50)
    print("# MEDICAL SERVICES API TESTS")
    print("#"*50)

    # Test login
    token = test_login()

    if token:
        # Test other endpoints
        test_get_users(token)
        test_get_professionals(token)
        test_get_patients(token)

        print("\n" + "="*50)
        print("All tests completed!")
        print("="*50)
    else:
        print("\nTests failed - could not authenticate")


if __name__ == '__main__':
    try:
        run_tests()
    except requests.exceptions.ConnectionError:
        print("\nERROR: Could not connect to API server")
        print("Make sure the server is running on http://localhost:5000")
    except Exception as e:
        print(f"\nERROR: {str(e)}")
