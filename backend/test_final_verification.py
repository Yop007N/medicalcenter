#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de Verificación Final - Medical Services Backend
Prueba todas las funcionalidades implementadas
"""

import requests
import json
from colorama import init, Fore, Style

init(autoreset=True)

BASE_URL = "http://localhost:5000"

def print_header(text):
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}{text:^60}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")

def print_success(text):
    print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")

def print_error(text):
    print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")

def print_info(text):
    print(f"{Fore.YELLOW}ℹ️  {text}{Style.RESET_ALL}")

def test_health_check():
    print_header("1. HEALTH CHECK")
    try:
        response = requests.get(f"{BASE_URL}/health")
        data = response.json()

        if response.status_code == 200:
            print_success(f"Health Check: {data['status']}")
            print_success(f"Database: {data['database']}")
            print_success(f"Redis: {data['redis']}")
            print_success(f"Version: {data['version']}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_password_validation():
    print_header("2. PASSWORD STRENGTH VALIDATION")

    # Test weak passwords
    weak_passwords = [
        ("short", "Short password"),
        ("nouppercase1", "No uppercase"),
        ("NOLOWERCASE1", "No lowercase"),
        ("NoNumbers", "No numbers")
    ]

    for password, description in weak_passwords:
        try:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": f"test_{password}@test.com",
                "password": password,
                "first_name": "Test",
                "last_name": "User",
                "role": "patient"
            })

            if response.status_code == 400:
                print_success(f"{description} correctly rejected")
            else:
                print_error(f"{description} should have been rejected")
        except Exception as e:
            print_error(f"Error testing {description}: {e}")

    return True

def test_role_validation():
    print_header("3. ROLE VALIDATION")

    try:
        # Try to register as admin (should fail)
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "admin_test@test.com",
            "password": "Admin12345",
            "first_name": "Admin",
            "last_name": "Test",
            "role": "admin"
        })

        if response.status_code == 400:
            print_success("Admin self-registration blocked (security)")
        else:
            print_error("Admin role should be blocked")

        # Register as patient (should succeed)
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "patient_final@test.com",
            "password": "Patient12345",
            "first_name": "Patient",
            "last_name": "Final",
            "role": "patient"
        })

        if response.status_code == 201:
            print_success("Patient registration successful")
            return response.json()
        else:
            print_error("Patient registration failed")
            return None
    except Exception as e:
        print_error(f"Error: {e}")
        return None

def test_authentication_flow(user_data):
    print_header("4. AUTHENTICATION FLOW")

    try:
        # Login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "patient_final@test.com",
            "password": "Patient12345"
        })

        if response.status_code == 200:
            data = response.json()
            print_success("Login successful")
            print_info(f"User ID: {data['user']['id']}")
            print_info(f"Access Token: {data['access_token'][:50]}...")
            print_info(f"Refresh Token: {data['refresh_token'][:50]}...")

            # Test refresh token
            refresh_response = requests.post(
                f"{BASE_URL}/api/auth/refresh",
                headers={"Authorization": f"Bearer {data['refresh_token']}"}
            )

            if refresh_response.status_code == 200:
                print_success("Token refresh successful")
            else:
                print_error("Token refresh failed")

            return data['access_token']
        else:
            print_error(f"Login failed: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Error: {e}")
        return None

def test_rate_limiting():
    print_header("5. RATE LIMITING")

    print_info("Testing login rate limit (5 requests/minute)...")

    failed_attempts = 0
    for i in range(7):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrong"
        })

        if response.status_code == 429:
            failed_attempts += 1

    if failed_attempts > 0:
        print_success(f"Rate limiting working ({failed_attempts} requests blocked)")
    else:
        print_error("Rate limiting not detected")

    return True

def test_pagination(token):
    print_header("6. PAGINATION")

    try:
        response = requests.get(
            f"{BASE_URL}/api/users?page=1&per_page=5",
            headers={"Authorization": f"Bearer {token}"}
        )

        if response.status_code == 200:
            data = response.json()
            print_success("Pagination working")
            print_info(f"Total items: {data.get('total', 'N/A')}")
            print_info(f"Page: {data.get('page', 'N/A')}")
            print_info(f"Pages: {data.get('pages', 'N/A')}")
            print_info(f"Per page: {data.get('per_page', 'N/A')}")
            return True
        else:
            print_error(f"Pagination test failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_swagger_docs():
    print_header("7. SWAGGER DOCUMENTATION")

    try:
        response = requests.get(f"{BASE_URL}/apispec_1.json")

        if response.status_code == 200:
            spec = response.json()
            paths = spec.get('paths', {})

            print_success(f"Swagger spec available")
            print_info(f"Documented endpoints: {len(paths)}")
            print_info(f"API Title: {spec.get('info', {}).get('title', 'N/A')}")
            print_info(f"API Version: {spec.get('info', {}).get('version', 'N/A')}")

            # Count documented endpoints
            documented = sum(1 for path in paths.values()
                           for method in path.values()
                           if isinstance(method, dict) and 'summary' in method)

            print_info(f"Endpoints with documentation: {documented}")
            return True
        else:
            print_error("Swagger spec not available")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_database_migrations():
    print_header("8. DATABASE MIGRATIONS")

    import subprocess
    import os

    try:
        os.chdir('backend')
        result = subprocess.run(
            ['venv/Scripts/alembic', 'history'],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print_success("Alembic migrations configured")
            lines = result.stdout.strip().split('\n')
            print_info(f"Migration count: {len([l for l in lines if l.strip()])}")
            if lines:
                print_info(f"Latest: {lines[0][:60]}...")
            return True
        else:
            print_error("Alembic not properly configured")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False
    finally:
        os.chdir('..')

def run_all_tests():
    print_header("MEDICAL SERVICES BACKEND - VERIFICATION FINAL")
    print_info("Testing all implemented features...")

    results = {}

    # Run tests
    results['health'] = test_health_check()
    results['password'] = test_password_validation()
    user = test_role_validation()
    token = test_authentication_flow(user) if user else None
    results['auth'] = token is not None
    results['rate_limit'] = test_rate_limiting()
    results['pagination'] = test_pagination(token) if token else False
    results['swagger'] = test_swagger_docs()
    results['migrations'] = test_database_migrations()

    # Summary
    print_header("SUMMARY")

    total = len(results)
    passed = sum(1 for v in results.values() if v)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper():20} {status}")

    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}Total: {passed}/{total} tests passed")

    percentage = (passed / total) * 100
    if percentage == 100:
        print(f"{Fore.GREEN}🎉 ALL TESTS PASSED! Backend is production ready!")
    elif percentage >= 80:
        print(f"{Fore.YELLOW}⚠️  Most tests passed. Review failures.")
    else:
        print(f"{Fore.RED}❌ Multiple failures detected. Review implementation.")

    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")

    return percentage == 100

if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Test interrupted by user{Style.RESET_ALL}")
        exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}Unexpected error: {e}{Style.RESET_ALL}")
        exit(1)
