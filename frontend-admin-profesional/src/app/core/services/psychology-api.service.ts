import { Injectable, inject } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import {
  PsychologicalEvaluation,
  PsychologicalEvaluationCreate,
  TherapySession,
  TherapySessionCreate
} from '../../models/psychology.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];
type EvaluationsResponse<T> = { evaluations?: T[] } | CollectionResponse<T>;
type SessionsResponse<T> = { sessions?: T[] } | CollectionResponse<T>;

@Injectable({ providedIn: 'root' })
export class PsychologyApiService {
  private apiClient = inject(ApiClientService);

  listEvaluations(
    patientIdOrFilters?: number | { patientId?: number; professionalId?: number }
  ): Observable<PsychologicalEvaluation[]> {
    const patientId =
      typeof patientIdOrFilters === 'number'
        ? patientIdOrFilters
        : patientIdOrFilters?.patientId;
    const professionalId =
      typeof patientIdOrFilters === 'number'
        ? undefined
        : patientIdOrFilters?.professionalId;

    if (typeof patientId === 'number') {
      return this.apiClient
        .get<EvaluationsResponse<PsychologicalEvaluation>>(
          API_ENDPOINTS.psychology.evaluationsByPatient(patientId)
        )
        .pipe(map((response) => this.mapEvaluations(response)));
    }

    if (typeof professionalId === 'number') {
      return this.apiClient
        .get<EvaluationsResponse<PsychologicalEvaluation>>(
          API_ENDPOINTS.psychology.evaluationsByProfessional(professionalId)
        )
        .pipe(map((response) => this.mapEvaluations(response)));
    }

    return of([]);
  }

  listEvaluationsByProfessional(professionalId: number): Observable<PsychologicalEvaluation[]> {
    return this.apiClient
      .get<EvaluationsResponse<PsychologicalEvaluation>>(
        API_ENDPOINTS.psychology.evaluationsByProfessional(professionalId)
      )
      .pipe(map((response) => this.mapEvaluations(response)));
  }

  listEvaluationsByPatient(patientId: number): Observable<PsychologicalEvaluation[]> {
    return this.apiClient
      .get<EvaluationsResponse<PsychologicalEvaluation>>(
        API_ENDPOINTS.psychology.evaluationsByPatient(patientId)
      )
      .pipe(map((response) => this.mapEvaluations(response)));
  }

  getEvaluation(id: number): Observable<PsychologicalEvaluation> {
    return this.apiClient.get<PsychologicalEvaluation>(API_ENDPOINTS.psychology.evaluationById(id));
  }

  createEvaluation(payload: PsychologicalEvaluationCreate): Observable<PsychologicalEvaluation> {
    return this.apiClient.post<PsychologicalEvaluation>(API_ENDPOINTS.psychology.evaluationsBase, payload);
  }

  updateEvaluation(id: number, payload: Partial<PsychologicalEvaluation>): Observable<PsychologicalEvaluation> {
    return this.apiClient.put<PsychologicalEvaluation>(API_ENDPOINTS.psychology.evaluationById(id), payload);
  }

  deleteEvaluation(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.psychology.evaluationById(id));
  }

  listSessions(evaluationId: number): Observable<TherapySession[]> {
    return this.apiClient
      .get<SessionsResponse<TherapySession>>(API_ENDPOINTS.psychology.evaluationSessions(evaluationId))
      .pipe(map((response) => this.mapSessions(response)));
  }

  listSessionsByPatientHistory(patientId: number): Observable<TherapySession[]> {
    return this.apiClient
      .get<SessionsResponse<TherapySession>>(API_ENDPOINTS.psychology.sessionsByPatientHistory(patientId))
      .pipe(map((response) => this.mapSessions(response)));
  }

  getSession(id: number): Observable<TherapySession> {
    return this.apiClient.get<TherapySession>(API_ENDPOINTS.psychology.sessionById(id));
  }

  createSession(payload: TherapySessionCreate): Observable<TherapySession> {
    return this.apiClient.post<TherapySession>(API_ENDPOINTS.psychology.sessionsBase, payload);
  }

  updateSession(id: number, payload: Partial<TherapySession>): Observable<TherapySession> {
    return this.apiClient.put<TherapySession>(API_ENDPOINTS.psychology.sessionById(id), payload);
  }

  deleteSession(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.psychology.sessionById(id));
  }

  private mapEvaluations(
    response: EvaluationsResponse<PsychologicalEvaluation>
  ): PsychologicalEvaluation[] {
    if (Array.isArray(response)) {
      return response;
    }
    if ('evaluations' in response && Array.isArray(response.evaluations)) {
      return response.evaluations;
    }
    if ('items' in response && Array.isArray(response.items)) {
      return response.items;
    }
    return [];
  }

  private mapSessions(response: SessionsResponse<TherapySession>): TherapySession[] {
    if (Array.isArray(response)) {
      return response;
    }
    if ('sessions' in response && Array.isArray(response.sessions)) {
      return response.sessions;
    }
    if ('items' in response && Array.isArray(response.items)) {
      return response.items;
    }
    return [];
  }
}
