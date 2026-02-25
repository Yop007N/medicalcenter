import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type PaginatedEvaluations<T> = {
  evaluations: T[];
  total: number;
  page: number;
  pages: number;
  page_size: number;
};

type PaginatedSessions<T> = {
  sessions: T[];
  total: number;
  page: number;
  pages: number;
  page_size: number;
};

export interface PsychologyEvaluation {
  id: number;
  patient_id: number;
  professional_id: number;
  reason: string;
  primary_diagnosis: string;
  treatment_recommendations: string;
  evaluation_date: string;
  status: 'active' | 'completed' | 'discontinued';
}

export interface TherapySession {
  id: number;
  evaluation_id: number;
  patient_id: number;
  professional_id: number;
  session_number: number;
  session_date: string;
  session_notes: string;
  session_type?: string;
  progress_rating?: number;
}

export interface PsychopedagogyEvaluation {
  id: number;
  patient_id: number;
  professional_id: number;
  reason: string;
  recommendations: string;
  evaluation_date: string;
  status: 'active' | 'completed' | 'discontinued';
}

export interface InterventionSession {
  id: number;
  evaluation_id: number;
  patient_id: number;
  professional_id: number;
  session_number: number;
  session_date: string;
  focus_area: string;
  progress_notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MentalHealthService {
  constructor(private api: ApiService) {}

  listProfessionalPsychologyEvaluations(professionalId: number): Observable<PsychologyEvaluation[]> {
    return this.api
      .get<PaginatedEvaluations<PsychologyEvaluation>>(
        API_ENDPOINTS.psychology.evaluationsByProfessional(professionalId)
      )
      .pipe(map((response) => response.evaluations || []));
  }

  createPsychologyEvaluation(payload: Partial<PsychologyEvaluation>): Observable<PsychologyEvaluation> {
    return this.api.post<PsychologyEvaluation>(API_ENDPOINTS.psychology.evaluationsBase, payload);
  }

  updatePsychologyEvaluation(
    evaluationId: number,
    payload: Partial<PsychologyEvaluation>
  ): Observable<PsychologyEvaluation> {
    return this.api.put<PsychologyEvaluation>(API_ENDPOINTS.psychology.evaluationById(evaluationId), payload);
  }

  deletePsychologyEvaluation(evaluationId: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.psychology.evaluationById(evaluationId));
  }

  listPsychologySessions(evaluationId: number): Observable<TherapySession[]> {
    return this.api
      .get<PaginatedSessions<TherapySession>>(API_ENDPOINTS.psychology.evaluationSessions(evaluationId))
      .pipe(map((response) => response.sessions || []));
  }

  createPsychologySession(payload: Partial<TherapySession>): Observable<TherapySession> {
    return this.api.post<TherapySession>(API_ENDPOINTS.psychology.sessionsBase, payload);
  }

  deletePsychologySession(sessionId: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.psychology.sessionById(sessionId));
  }

  listProfessionalPsychopedagogyEvaluations(
    professionalId: number
  ): Observable<PsychopedagogyEvaluation[]> {
    return this.api
      .get<PaginatedEvaluations<PsychopedagogyEvaluation>>(
        API_ENDPOINTS.psychopedagogy.evaluationsByProfessional(professionalId)
      )
      .pipe(map((response) => response.evaluations || []));
  }

  createPsychopedagogyEvaluation(
    payload: Partial<PsychopedagogyEvaluation>
  ): Observable<PsychopedagogyEvaluation> {
    return this.api.post<PsychopedagogyEvaluation>(API_ENDPOINTS.psychopedagogy.evaluationsBase, payload);
  }

  updatePsychopedagogyEvaluation(
    evaluationId: number,
    payload: Partial<PsychopedagogyEvaluation>
  ): Observable<PsychopedagogyEvaluation> {
    return this.api.put<PsychopedagogyEvaluation>(
      API_ENDPOINTS.psychopedagogy.evaluationById(evaluationId),
      payload
    );
  }

  deletePsychopedagogyEvaluation(evaluationId: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.psychopedagogy.evaluationById(evaluationId));
  }

  listPsychopedagogySessions(evaluationId: number): Observable<InterventionSession[]> {
    return this.api
      .get<PaginatedSessions<InterventionSession>>(
        API_ENDPOINTS.psychopedagogy.evaluationSessions(evaluationId)
      )
      .pipe(map((response) => response.sessions || []));
  }

  createPsychopedagogySession(payload: Partial<InterventionSession>): Observable<InterventionSession> {
    return this.api.post<InterventionSession>(API_ENDPOINTS.psychopedagogy.sessionsBase, payload);
  }

  deletePsychopedagogySession(sessionId: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.psychopedagogy.sessionById(sessionId));
  }
}
