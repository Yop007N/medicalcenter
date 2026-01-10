# -*- coding: utf-8 -*-
"""
Tests for Psychopedagogy module (Psychopedagogical Evaluations and Intervention Sessions)
"""

import pytest
from datetime import date, timedelta
from app.models.psychopedagogy import PsychopedagogicalEvaluation, InterventionSession
from app.models.patient import Patient
from app.models.professional import Professional


class TestPsychopedagogicalEvaluations:
    """Test cases for Psychopedagogical Evaluation endpoints"""

    def test_create_evaluation(self, client, auth_headers, sample_patient, sample_professional):
        """Test creating a new psychopedagogical evaluation"""
        data = {
            'patient_id': sample_patient.id,
            'school_name': 'Colegio San José',
            'grade': '5to grado',
            'academic_year': 2025,
            'reason': 'Dificultades en lectura y escritura',
            'presenting_problem': 'El niño presenta dislexia probable',
            'reading_level': 'below_grade',
            'reading_score': 45,
            'math_level': 'at_grade',
            'math_score': 75,
            'learning_difficulties': ['dyslexia'],
            'recommendations': 'Intervención psicopedagógica 2 veces por semana',
            'evaluation_date': str(date.today())
        }

        response = client.post(
            '/api/psychopedagogy/evaluations',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['patient_id'] == sample_patient.id
        assert json_data['school_name'] == 'Colegio San José'
        assert json_data['reading_level'] == 'below_grade'
        assert 'dyslexia' in json_data['learning_difficulties']

    def test_get_evaluation_by_id(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving a specific evaluation by ID"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación inicial',
            recommendations='Continuar con seguimiento',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        response = client.get(
            f'/api/psychopedagogy/evaluations/{evaluation.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['id'] == evaluation.id
        assert json_data['reason'] == 'Evaluación inicial'

    def test_update_evaluation(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test updating a psychopedagogical evaluation"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Dificultades de aprendizaje',
            recommendations='Evaluación inicial',
            evaluation_date=date.today(),
            status='active'
        )
        db_session.add(evaluation)
        db_session.commit()

        update_data = {
            'recommendations': 'Recomendaciones actualizadas: 3 sesiones semanales',
            'status': 'completed',
            'learning_difficulties': ['dyslexia', 'dyscalculia']
        }

        response = client.put(
            f'/api/psychopedagogy/evaluations/{evaluation.id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['status'] == 'completed'
        assert 'dyslexia' in json_data['learning_difficulties']
        assert 'dyscalculia' in json_data['learning_difficulties']

    def test_delete_evaluation(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test deleting a psychopedagogical evaluation"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación a eliminar',
            recommendations='Ninguna',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        evaluation_id = evaluation.id

        response = client.delete(
            f'/api/psychopedagogy/evaluations/{evaluation_id}',
            headers=auth_headers
        )

        assert response.status_code == 200

        # Verify deletion
        response = client.get(
            f'/api/psychopedagogy/evaluations/{evaluation_id}',
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_patient_evaluations(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving all evaluations for a patient"""
        eval1 = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Primera evaluación',
            recommendations='Seguimiento',
            evaluation_date=date.today() - timedelta(days=60),
            status='completed'
        )
        eval2 = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Segunda evaluación',
            recommendations='Continuar',
            evaluation_date=date.today(),
            status='active'
        )
        db_session.add_all([eval1, eval2])
        db_session.commit()

        response = client.get(
            f'/api/psychopedagogy/evaluations/patient/{sample_patient.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'evaluations' in json_data
        assert json_data['total'] >= 2

    def test_get_professional_evaluations(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving all evaluations by a professional"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación del profesional',
            recommendations='Seguimiento',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        response = client.get(
            f'/api/psychopedagogy/evaluations/professional/{sample_professional.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'evaluations' in json_data
        assert json_data['total'] >= 1

    def test_create_evaluation_missing_fields(self, client, auth_headers):
        """Test creating evaluation with missing required fields"""
        data = {
            'school_name': 'Test School'
            # Missing patient_id, reason, recommendations, evaluation_date
        }

        response = client.post(
            '/api/psychopedagogy/evaluations',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400

    def test_filter_evaluations_by_status(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test filtering evaluations by status"""
        eval1 = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación activa',
            recommendations='Continuar',
            evaluation_date=date.today(),
            status='active'
        )
        eval2 = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Evaluación completada',
            recommendations='Finalizada',
            evaluation_date=date.today() - timedelta(days=30),
            status='completed'
        )
        db_session.add_all([eval1, eval2])
        db_session.commit()

        response = client.get(
            f'/api/psychopedagogy/evaluations/patient/{sample_patient.id}?status=active',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        for evaluation in json_data['evaluations']:
            assert evaluation['status'] == 'active'


class TestInterventionSessions:
    """Test cases for Intervention Session endpoints"""

    def test_create_session(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test creating a new intervention session"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Dificultades de lectura',
            recommendations='Sesiones de intervención',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session_data = {
            'evaluation_id': evaluation.id,
            'patient_id': sample_patient.id,
            'session_date': str(date.today()),
            'duration_minutes': 60,
            'focus_area': 'reading_comprehension',
            'skills_targeted': ['phonemic_awareness', 'decoding'],
            'activities': [
                {'name': 'Word building', 'duration': 20, 'materials': 'letter tiles'},
                {'name': 'Reading practice', 'duration': 30, 'book': 'Level 2 reader'}
            ],
            'student_engagement': 'high',
            'progress_rating': 4
        }

        response = client.post(
            '/api/psychopedagogy/sessions',
            json=session_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['focus_area'] == 'reading_comprehension'
        assert json_data['student_engagement'] == 'high'
        assert json_data['session_number'] == 1  # Auto-incremented

    def test_get_session_by_id(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving a specific session by ID"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session = InterventionSession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=1,
            session_date=date.today(),
            focus_area='math_skills'
        )
        db_session.add(session)
        db_session.commit()

        response = client.get(
            f'/api/psychopedagogy/sessions/{session.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['id'] == session.id
        assert json_data['focus_area'] == 'math_skills'

    def test_update_session(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test updating an intervention session"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session = InterventionSession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=1,
            session_date=date.today(),
            focus_area='writing'
        )
        db_session.add(session)
        db_session.commit()

        update_data = {
            'progress_rating': 5,
            'progress_notes': 'Excelente progreso en la sesión de hoy',
            'homework_assigned': 'Practicar escritura de 10 palabras diarias'
        }

        response = client.put(
            f'/api/psychopedagogy/sessions/{session.id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['progress_rating'] == 5
        assert 'Excelente progreso' in json_data['progress_notes']

    def test_delete_session(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test deleting an intervention session"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session = InterventionSession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=1,
            session_date=date.today(),
            focus_area='attention'
        )
        db_session.add(session)
        db_session.commit()

        session_id = session.id

        response = client.delete(
            f'/api/psychopedagogy/sessions/{session_id}',
            headers=auth_headers
        )

        assert response.status_code == 200

        # Verify deletion
        response = client.get(
            f'/api/psychopedagogy/sessions/{session_id}',
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_evaluation_sessions(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving all sessions for an evaluation"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        session1 = InterventionSession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=1,
            session_date=date.today() - timedelta(days=7),
            focus_area='reading'
        )
        session2 = InterventionSession(
            evaluation_id=evaluation.id,
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            session_number=2,
            session_date=date.today(),
            focus_area='writing'
        )
        db_session.add_all([session1, session2])
        db_session.commit()

        response = client.get(
            f'/api/psychopedagogy/evaluations/{evaluation.id}/sessions',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'sessions' in json_data
        assert len(json_data['sessions']) == 2

    def test_get_patient_session_history(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving complete session history for a patient"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        # Create multiple sessions
        for i in range(3):
            session = InterventionSession(
                evaluation_id=evaluation.id,
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                session_number=i + 1,
                session_date=date.today() - timedelta(days=7 * i),
                focus_area=f'area_{i}'
            )
            db_session.add(session)
        db_session.commit()

        response = client.get(
            f'/api/psychopedagogy/sessions/patient/{sample_patient.id}/history',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'sessions' in json_data
        assert json_data['total'] >= 3

    def test_auto_increment_session_number(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test that session numbers are auto-incremented"""
        evaluation = PsychopedagogicalEvaluation(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            reason='Test',
            recommendations='Test',
            evaluation_date=date.today()
        )
        db_session.add(evaluation)
        db_session.commit()

        # Create first session
        session1_data = {
            'evaluation_id': evaluation.id,
            'patient_id': sample_patient.id,
            'session_date': str(date.today()),
            'focus_area': 'reading'
        }

        response1 = client.post(
            '/api/psychopedagogy/sessions',
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
            'focus_area': 'math'
        }

        response2 = client.post(
            '/api/psychopedagogy/sessions',
            json=session2_data,
            headers=auth_headers
        )
        assert response2.status_code == 201
        assert response2.get_json()['session_number'] == 2

    def test_create_session_missing_fields(self, client, auth_headers):
        """Test creating session with missing required fields"""
        data = {
            'focus_area': 'reading'
            # Missing evaluation_id, patient_id, session_date
        }

        response = client.post(
            '/api/psychopedagogy/sessions',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400
