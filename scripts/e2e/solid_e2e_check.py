#!/usr/bin/env python3
"""End-to-end smoke checks for backend and the three actor frontends."""

import argparse
import json
import sys
from dataclasses import dataclass
from uuid import uuid4
from typing import Dict, List, Optional, Tuple
from urllib import error, request


@dataclass
class Actor:
    name: str
    email: str
    password: str


@dataclass
class FrontendTarget:
    name: str
    base_url: str
    login_path: str
    actor: Actor


def _http_json(
    method: str,
    url: str,
    payload: Optional[Dict] = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 20,
) -> Tuple[int, Dict]:
    body = None
    request_headers = {"Content-Type": "application/json"}
    if headers:
        request_headers.update(headers)
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
    req = request.Request(url=url, method=method, data=body, headers=request_headers)
    try:
        with request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8") if response.length != 0 else "{}"
            data = json.loads(raw) if raw else {}
            return response.getcode(), data
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8") if exc.fp else "{}"
        try:
            payload_data = json.loads(raw)
        except json.JSONDecodeError:
            payload_data = {"raw": raw}
        return exc.code, payload_data


def _http_status(url: str, timeout: int = 20) -> int:
    req = request.Request(url=url, method="GET")
    try:
        with request.urlopen(req, timeout=timeout) as response:
            return response.getcode()
    except error.HTTPError as exc:
        return exc.code


def _login(base_url: str, actor: Actor) -> Tuple[int, Dict]:
    return _http_json(
        method="POST",
        url=f"{base_url}/api/auth/login",
        payload={"email": actor.email, "password": actor.password},
    )


def _register(base_url: str, payload: Dict) -> Tuple[int, Dict]:
    return _http_json(
        method="POST",
        url=f"{base_url}/api/auth/register",
        payload=payload,
    )


def _role_check_endpoint(actor_name: str, user_id: int) -> str:
    if actor_name == "admin":
        return "/api/users"
    if actor_name == "professional":
        return "/api/appointments"
    return f"/api/clinical-history/summary/{user_id}"


def _print_result(ok: bool, label: str, detail: str) -> None:
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {label}: {detail}")


def run(args: argparse.Namespace) -> int:
    admin = Actor("admin", args.admin_email, args.admin_password)
    professional = Actor("professional", args.professional_email, args.professional_password)
    patient = Actor("patient", args.patient_email, args.patient_password)

    failures: List[str] = []

    health_status = _http_status(f"{args.backend_url}/health")
    health_ok = health_status == 200
    _print_result(health_ok, "backend health", f"GET /health -> {health_status}")
    if not health_ok:
        failures.append("Backend health check failed")

    if args.verify_register:
        patient_email = f"e2e.patient.{uuid4().hex[:10]}@test.com"
        patient_register_code, _ = _register(
            args.backend_url,
            {
                "email": patient_email,
                "password": "Patient123",
                "first_name": "E2E",
                "last_name": "Patient",
                "role": "patient",
            },
        )
        patient_register_ok = patient_register_code == 201
        _print_result(patient_register_ok, "register patient", f"POST /api/auth/register -> {patient_register_code}")
        if not patient_register_ok:
            failures.append("Patient register flow failed")

        professional_email = f"e2e.professional.{uuid4().hex[:10]}@test.com"
        professional_register_code, _ = _register(
            args.backend_url,
            {
                "email": professional_email,
                "password": "Doctor123",
                "first_name": "E2E",
                "last_name": "Professional",
                "role": "professional",
            },
        )
        professional_register_ok = professional_register_code == 201
        _print_result(
            professional_register_ok,
            "register professional",
            f"POST /api/auth/register -> {professional_register_code}",
        )
        if not professional_register_ok:
            failures.append("Professional register flow failed")

        login_registered_patient_code, _ = _http_json(
            method="POST",
            url=f"{args.backend_url}/api/auth/login",
            payload={
                "email": patient_email,
                "password": "Patient123",
            },
        )
        login_registered_patient_ok = login_registered_patient_code == 200
        _print_result(
            login_registered_patient_ok,
            "registered patient login",
            f"POST /api/auth/login -> {login_registered_patient_code}",
        )
        if not login_registered_patient_ok:
            failures.append("Registered patient login failed")

        login_registered_professional_code, _ = _http_json(
            method="POST",
            url=f"{args.backend_url}/api/auth/login",
            payload={
                "email": professional_email,
                "password": "Doctor123",
            },
        )
        login_registered_professional_ok = login_registered_professional_code == 200
        _print_result(
            login_registered_professional_ok,
            "registered professional login",
            f"POST /api/auth/login -> {login_registered_professional_code}",
        )
        if not login_registered_professional_ok:
            failures.append("Registered professional login failed")

    backend_tokens: Dict[str, Tuple[str, int]] = {}
    for actor in (admin, professional, patient):
        code, payload = _login(args.backend_url, actor)
        ok = code == 200 and "access_token" in payload and "user" in payload
        _print_result(ok, f"{actor.name} backend login", f"POST /api/auth/login -> {code}")
        if not ok:
            failures.append(f"Backend login failed for actor={actor.name}")
            continue

        token = payload["access_token"]
        user_id = int(payload["user"]["id"])
        backend_tokens[actor.name] = (token, user_id)

        endpoint = _role_check_endpoint(actor.name, user_id)
        role_code, _ = _http_json(
            method="GET",
            url=f"{args.backend_url}{endpoint}",
            headers={"Authorization": f"Bearer {token}"},
        )
        role_ok = role_code == 200
        _print_result(role_ok, f"{actor.name} backend role-check", f"GET {endpoint} -> {role_code}")
        if not role_ok:
            failures.append(f"Backend role-check failed for actor={actor.name}")

    frontend_targets = [
        FrontendTarget("frontend-admin", args.frontend_admin_url, "/auth/login", admin),
        FrontendTarget("frontend-profesional", args.frontend_profesional_url, "/auth/login", professional),
        FrontendTarget("frontend-paciente", args.frontend_paciente_url, "/auth/login", patient),
    ]

    for target in frontend_targets:
        page_code = _http_status(f"{target.base_url}{target.login_path}")
        page_ok = page_code == 200
        _print_result(page_ok, f"{target.name} page", f"GET {target.login_path} -> {page_code}")
        if not page_ok:
            failures.append(f"Frontend page unavailable: {target.name}")

        login_code, login_payload = _login(target.base_url, target.actor)
        login_ok = login_code == 200 and "access_token" in login_payload and "user" in login_payload
        _print_result(login_ok, f"{target.name} auth proxy", f"POST /api/auth/login -> {login_code}")
        if not login_ok:
            failures.append(f"Frontend auth proxy failed: {target.name}")
            continue

        token = login_payload["access_token"]
        user_id = int(login_payload["user"]["id"])
        endpoint = _role_check_endpoint(target.actor.name, user_id)
        role_code, _ = _http_json(
            method="GET",
            url=f"{target.base_url}{endpoint}",
            headers={"Authorization": f"Bearer {token}"},
        )
        role_ok = role_code == 200
        _print_result(role_ok, f"{target.name} role-check", f"GET {endpoint} -> {role_code}")
        if not role_ok:
            failures.append(f"Frontend role-check failed: {target.name}")

    if failures:
        print("\nE2E summary: FAIL")
        for item in failures:
            print(f"- {item}")
        return 1

    print("\nE2E summary: PASS")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Medical Services SOLID E2E smoke checker")
    parser.add_argument("--backend-url", default="http://127.0.0.1:5000")
    parser.add_argument("--frontend-admin-url", default="http://127.0.0.1:4200")
    parser.add_argument("--frontend-profesional-url", default="http://127.0.0.1")
    parser.add_argument("--frontend-paciente-url", default="http://127.0.0.1:8100")

    parser.add_argument("--admin-email", default="admin@medical.com")
    parser.add_argument("--admin-password", default="admin123")
    parser.add_argument("--professional-email", default="doctor@medical.com")
    parser.add_argument("--professional-password", default="doctor123")
    parser.add_argument("--patient-email", default="patient@medical.com")
    parser.add_argument("--patient-password", default="patient123")
    parser.add_argument("--verify-register", action="store_true", default=True)
    parser.add_argument("--skip-register", action="store_false", dest="verify_register")

    return parser.parse_args()


if __name__ == "__main__":
    sys.exit(run(parse_args()))
