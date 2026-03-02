# -*- coding: utf-8 -*-
"""
Tests for Psychology module (Psychological Evaluations and Therapy Sessions)
"""

import pytest
from datetime import date, timedelta
from app.models.psychology import PsychologicalEvaluation, TherapySession
from app.models.professional import Professional
from app.models.professional_patient_assignment import ProfessionalPatientAssignment


class TestPsychologicalEvaluations:
    """Test cases for Psychological Evaluation endpoints"""

    def test_create_evaluation(self, client, auth_headers, sample_patient, sample_professional):
        """Test creating a new psychological evaluation"""
        data = {
            'patient_id': sample_patient.id,
            'reason': 'Ansiedad y depresión',
            'presenting_problem': 'Episodios de ansiedad recurrentes',
            'symptoms_duration': '6 meses',
            'current_symptoms': [
                {'symptom': 'anxiety', 'severity': 'moderate', 'frequency': 'daily'},
                {'symptom': 'insomnia', 'severity': 'severe', 'frequency': 'nightly'}
            ],
            'mood': 'anxious',
            'affect': 'congruent',
            'insight': 'good',
            'judgment': 'good',
            'suicide_risk': 'low',
            'primary_diagnosis': 'Trastorno de Ansiedad Generalizada',
            'dsm5_code': 'F41.1',
            'treatment_recommendations': 'Terapia cognitivo-conductual semanal',
            'therapy_type': 'CBT',
            'evaluation_date': str(date.today())
        }

        response = client.post(
            '/api/psychology/evaluations',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['patient_id'] == sample_patient.id
        assert json_data['primary_diagnosis'] == 'Trastorno de Ansiedad Generalizada'
        assert json_data['dsm5_code'] == 'F41.1'
        assert json_data['therapy_type'] == 'CBT'

    def test_get_evaluation_by_id(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving a specific evaluation by ID"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación inicial',
            primary_diagnosis='Depresión Mayor',
            treatment_recommendations='Terapia y medicación',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        response = client.get(
            f'/api/psychology/evaluations/{evaluation.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['id'] == evaluation.id
        assert json_data['primary_diagnosis'] == 'Depresión Mayor'

    def test_update_evaluation(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test updating a psychological evaluation"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Ansiedad',
            primary_diagnosis='Trastorno de Ansiedad',
            treatment_recommendations='TCC',
            evaluation_date=date.today(),
            status='active'
        )
        db_session.add(evaluation)
        db_session.commit()

        update_data = {
            'treatment_recommendations': 'TCC + técnicas de relajación',
            'status': 'completed',
            'secondary_diagnoses': ['Trastorno de Sueño'],
            'suicide_risk': 'none'
        }

        response = client.put(
            f'/api/psychology/evaluations/{evaluation.id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['status'] == 'completed'
        assert 'Trastorno de Sueño' in json_data['secondary_diagnoses']
        assert json_data['suicide_risk'] == 'none'

    def test_delete_evaluation(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test deleting a psychological evaluation"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación a eliminar',
            primary_diagnosis='Test',
            treatment_recommendations='Ninguna',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        evaluation_id = evaluation.id

        response = client.delete(
            f'/api/psychology/evaluations/{evaluation_id}',
            headers=auth_headers
        )

        assert response.status_code == 200

        # Verify deletion
        response = client.get(
            f'/api/psychology/evaluations/{evaluation_id}',
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_patient_evaluations(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving all evaluations for a patient"""
        eval1 = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Primera evaluación',
            primary_diagnosis='Ansiedad',
            treatment_recommendations='TCC',
            evaluation_date=date.today() - timedelta(days=60),
            status='completed'
        )
        eval2 = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Segunda evaluación',
            primary_diagnosis='Depresión',
            treatment_recommendations='Medicación',
            evaluation_date=date.today(),
            status='active'
        )
        db_session.add_all([eval1, eval2])
        db_session.commit()

        response = client.get(
            f'/api/psychology/evaluations/patient/{sample_patient.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'evaluations' in json_data
        assert json_data['total'] >= 2

    def test_get_professional_evaluations(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving all evaluations by a professional"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación del profesional',
            primary_diagnosis='TDAH',
            treatment_recommendations='Seguimiento',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        response = client.get(
            f'/api/psychology/evaluations/professional/{sample_professional.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'evaluations' in json_data
        assert json_data['total'] >= 1

    def test_create_evaluation_missing_fields(self, client, auth_headers):
        """Test creating evaluation with missing required fields"""
        data = {
            'reason': 'Test reason'
            # Missing patient_id, primary_diagnosis, treatment_recommendations, evaluation_date
        }

        response = client.post(
            '/api/psychology/evaluations',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400

    def test_filter_evaluations_by_status(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test filtering evaluations by status"""
        eval1 = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación activa',
            primary_diagnosis='Ansiedad',
            treatment_recommendations='TCC',
            evaluation_date=date.today(),
            status='active'
        )
        eval2 = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación completada',
            primary_diagnosis='Depresión',
            treatment_recommendations='Finalizada',
            evaluation_date=date.today() - timedelta(days=30),
            status='completed'
        )
        db_session.add_all([eval1, eval2])
        db_session.commit()

        response = client.get(
            f'/api/psychology/evaluations/patient/{sample_patient.id}?status=active',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        for evaluation in json_data['evaluations']:
            assert evaluation['status'] == 'active'

    def test_risk_assessment_levels(self, client, auth_headers, sample_patient, sample_professional):
        """Test creating evaluation with various risk levels"""
        data = {
            'patient_id': sample_patient.id,
            'reason': 'Evaluación de riesgo',
            'primary_diagnosis': 'Depresión Mayor',
            'treatment_recommendations': 'Hospitalización',
            'evaluation_date': str(date.today()),
            'suicide_risk': 'high',
            'homicide_risk': 'none',
            'self_harm_risk': 'moderate'
        }

        response = client.post(
            '/api/psychology/evaluations',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['suicide_risk'] == 'high'
        assert json_data['homicide_risk'] == 'none'
        assert json_data['self_harm_risk'] == 'moderate'

    def test_create_evaluation_as_admin_resolves_professional_assignment(
        self,
        client,
        admin_auth_headers,
        sample_patient,
        db_session,
    ):
        """Admin can create evaluation and backend resolves a module professional."""
        psychology_professional = Professional(
            email='psych.admin.flow@test.com',
            first_name='Psy',
            last_name='Owner',
            role='professional',
            license_number='PSY-ADMIN-001',
            specialty='Psicologia Clinica',
            is_active=True,
        )
        psychology_professional.set_password('Doctor123')
        db_session.add(psychology_professional)
        db_session.flush()
        db_session.add(
            ProfessionalPatientAssignment(
                professional_id=psychology_professional.id,
                patient_id=sample_patient.id,
                specialty_key='psychology',
            )
        )
        db_session.commit()

        payload = {
            'patient_id': sample_patient.id,
            'reason': 'Seguimiento admin',
            'primary_diagnosis': 'Ansiedad',
            'treatment_recommendations': 'Terapia semanal',
            'evaluation_date': str(date.today()),
        }
        response = client.post(
            '/api/psychology/evaluations',
            json=payload,
            headers=admin_auth_headers,
        )

        assert response.status_code == 201
        assert response.get_json()['professional_id'] == psychology_professional.id


class TestTherapySessions:
    """Test cases for Therapy Session endpoints"""

    def test_create_session(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test creating a new therapy session"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Ansiedad',
            primary_diagnosis='Trastorno de Ansiedad Generalizada',
            treatment_recommendations='TCC semanal',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session_data = {
            'evaluation_id': evaluation.id,
            'patient_id': sample_patient.id,
            'session_date': str(date.today()),
            'duration_minutes': 50,
            'session_type': 'individual',
            'modality': 'in_person',
            'presenting_issues': ['anxiety_spike', 'work_stress'],
            'patient_mood': 'anxious',
            'topics_discussed': ['coping_strategies', 'work_stress'],
            'interventions_used': [
                {'technique': 'cognitive_restructuring', 'target': 'negative_thoughts'},
                {'technique': 'breathing_exercises', 'purpose': 'anxiety_management'}
            ],
            'session_notes': 'Paciente muestra avances en manejo de ansiedad',
            'progress_rating': 4,
            'therapeutic_alliance': 'good'
        }

        response = client.post(
            '/api/psychology/sessions',
            json=session_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['modality'] == 'in_person'
        assert json_data['patient_mood'] == 'anxious'
        assert json_data['session_number'] == 1  # Auto-incremented

    def test_get_session_by_id(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving a specific session by ID"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            primary_diagnosis='Test',
            treatment_recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session = TherapySession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=1,
            session_date=date.today(),
            session_notes='Sesión inicial'
        )
        db_session.add(session)
        db_session.commit()

        response = client.get(
            f'/api/psychology/sessions/{session.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['id'] == session.id
        assert json_data['session_notes'] == 'Sesión inicial'

    def test_update_session(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test updating a therapy session"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            primary_diagnosis='Test',
            treatment_recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session = TherapySession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=1,
            session_date=date.today(),
            session_notes='Notas iniciales'
        )
        db_session.add(session)
        db_session.commit()

        update_data = {
            'progress_rating': 5,
            'clinical_impressions': 'Excelente progreso terapéutico',
            'homework_assigned': 'Practicar técnicas de respiración diarias',
            'session_outcome': 'breakthrough'
        }

        response = client.put(
            f'/api/psychology/sessions/{session.id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['progress_rating'] == 5
        assert json_data['session_outcome'] == 'breakthrough'

    def test_delete_session(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test deleting a therapy session"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            primary_diagnosis='Test',
            treatment_recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session = TherapySession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=1,
            session_date=date.today(),
            session_notes='A eliminar'
        )
        db_session.add(session)
        db_session.commit()

        session_id = session.id

        response = client.delete(
            f'/api/psychology/sessions/{session_id}',
            headers=auth_headers
        )

        assert response.status_code == 200

        # Verify deletion
        response = client.get(
            f'/api/psychology/sessions/{session_id}',
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_evaluation_sessions(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving all sessions for an evaluation"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            primary_diagnosis='Test',
            treatment_recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session1 = TherapySession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=1,
            session_date=date.today() - timedelta(days=7),
            session_notes='Sesión 1'
        )
        session2 = TherapySession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=2,
            session_date=date.today(),
            session_notes='Sesión 2'
        )
        db_session.add_all([session1, session2])
        db_session.commit()

        response = client.get(
            f'/api/psychology/evaluations/{evaluation.id}/sessions',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'sessions' in json_data
        assert len(json_data['sessions']) == 2

    def test_get_patient_session_history(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving complete session history for a patient"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            primary_diagnosis='Test',
            treatment_recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        # Create multiple sessions
        for i in range(4):
            session = TherapySession(
                evaluation_id=evaluation.id,
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                session_number=i + 1,
                session_date=date.today() - timedelta(days=7 * i),
                session_notes=f'Sesión {i + 1}'
            )
            db_session.add(session)
        db_session.commit()

        response = client.get(
            f'/api/psychology/sessions/patient/{sample_patient.id}/history',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'sessions' in json_data
        assert json_data['total'] >= 4

    def test_mark_crisis_intervention(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test marking a session as having crisis intervention"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Crisis',
            primary_diagnosis='Depresión Mayor',
            treatment_recommendations='Intervención inmediata',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session = TherapySession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=1,
            session_date=date.today(),
            session_notes='Sesión de crisis'
        )
        db_session.add(session)
        db_session.commit()

        crisis_data = {
            'safety_assessment': 'Paciente presenta ideación suicida pasiva',
            'risk_level': 'moderate'
        }

        response = client.post(
            f'/api/psychology/sessions/{session.id}/crisis',
            json=crisis_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['crisis_intervention'] is True
        assert json_data['risk_level'] == 'moderate'

    def test_session_modalities(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test different session modalities"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            primary_diagnosis='Test',
            treatment_recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        # Test teletherapy
        session_data = {
            'evaluation_id': evaluation.id,
            'patient_id': sample_patient.id,
            'session_date': str(date.today()),
            'modality': 'teletherapy',
            'session_notes': 'Sesión por videollamada'
        }

        response = client.post(
            '/api/psychology/sessions',
            json=session_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['modality'] == 'teletherapy'

    def test_auto_increment_session_number(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test that session numbers are auto-incremented"""
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            primary_diagnosis='Test',
            treatment_recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        # Create first session
        session1_data = {
            'evaluation_id': evaluation.id,
            'patient_id': sample_patient.id,
            'session_date': str(date.today()),
            'session_notes': 'Primera sesión'
        }

        response1 = client.post(
            '/api/psychology/sessions',
            json=session1_data,
            headers=auth_headers
        )
        assert response1.status_code == 201
        assert response1.get_json()['session_number'] == 1

        # Create second session
        session2_data = {
            'evaluation_id': evaluation.id,
            'patient_id': sample_patient.id,
            'session_date': str(date.today()),
            'session_notes': 'Segunda sesión'
        }

        response2 = client.post(
            '/api/psychology/sessions',
            json=session2_data,
            headers=auth_headers
        )
        assert response2.status_code == 201
        assert response2.get_json()['session_number'] == 2

    def test_create_session_missing_fields(self, client, auth_headers):
        """Test creating session with missing required fields"""
        data = {
            'modality': 'in_person'
            # Missing evaluation_id, patient_id, session_date, session_notes
        }

        response = client.post(
            '/api/psychology/sessions',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400

    def test_create_session_as_admin_uses_evaluation_professional(
        self,
        client,
        admin_auth_headers,
        sample_patient,
        db_session,
    ):
        """Admin session creation should inherit module professional from evaluation."""
        psychology_professional = Professional(
            email='psych.session.admin@test.com',
            first_name='Psy',
            last_name='Session',
            role='professional',
            license_number='PSY-ADMIN-002',
            specialty='Psicologia',
            is_active=True,
        )
        psychology_professional.set_password('Doctor123')
        db_session.add(psychology_professional)
        db_session.flush()
        db_session.add(
            ProfessionalPatientAssignment(
                professional_id=psychology_professional.id,
                patient_id=sample_patient.id,
                specialty_key='psychology',
            )
        )
        evaluation = PsychologicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=psychology_professional.id,
            reason='Base',
            primary_diagnosis='Ansiedad',
            treatment_recommendations='Plan',
            evaluation_date=date.today(),
        )
        db_session.add(evaluation)
        db_session.commit()

        session_payload = {
            'evaluation_id': evaluation.id,
            'patient_id': sample_patient.id,
            'session_date': str(date.today()),
            'session_notes': 'Sesion creada por admin',
        }
        response = client.post(
            '/api/psychology/sessions',
            json=session_payload,
            headers=admin_auth_headers,
        )

        assert response.status_code == 201
        assert response.get_json()['professional_id'] == psychology_professional.id
