import { Injectable, inject } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import {
  InterventionSession,
  InterventionSessionCreate,
  PsychopedagogicalEvaluation,
  PsychopedagogicalEvaluationCreate
} from '../../models/psychopedagogy.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];
type EvaluationsResponse<T> = { evaluations?: T[] } | CollectionResponse<T>;
type SessionsResponse<T> = { sessions?: T[] } | CollectionResponse<T>;

@Injectable({ providedIn: 'root' })
export class PsychopedagogyApiService {
  private apiClient = inject(ApiClientService);

  listEvaluations(
    patientIdOrFilters?: number | { patientId?: number; professionalId?: number }
  ): Observable<PsychopedagogicalEvaluation[]> {
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
        .get<EvaluationsResponse<PsychopedagogicalEvaluation>>(
          API_ENDPOINTS.psychopedagogy.evaluationsByPatient(patientId)
        )
        .pipe(map((response) => this.mapEvaluations(response)));
    }

    if (typeof professionalId === 'number') {
      return this.apiClient
        .get<EvaluationsResponse<PsychopedagogicalEvaluation>>(
          API_ENDPOINTS.psychopedagogy.evaluationsByProfessional(professionalId)
        )
        .pipe(map((response) => this.mapEvaluations(response)));
    }

    return of([]);
  }

  listEvaluationsByProfessional(professionalId: number): Observable<PsychopedagogicalEvaluation[]> {
    return this.apiClient
      .get<EvaluationsResponse<PsychopedagogicalEvaluation>>(
        API_ENDPOINTS.psychopedagogy.evaluationsByProfessional(professionalId)
      )
      .pipe(map((response) => this.mapEvaluations(response)));
  }

  listEvaluationsByPatient(patientId: number): Observable<PsychopedagogicalEvaluation[]> {
    return this.apiClient
      .get<EvaluationsResponse<PsychopedagogicalEvaluation>>(
        API_ENDPOINTS.psychopedagogy.evaluationsByPatient(patientId)
      )
      .pipe(map((response) => this.mapEvaluations(response)));
  }

  getEvaluation(id: number): Observable<PsychopedagogicalEvaluation> {
    return this.apiClient.get<PsychopedagogicalEvaluation>(API_ENDPOINTS.psychopedagogy.evaluationById(id));
  }

  createEvaluation(payload: PsychopedagogicalEvaluationCreate): Observable<PsychopedagogicalEvaluation> {
    return this.apiClient.post<PsychopedagogicalEvaluation>(API_ENDPOINTS.psychopedagogy.evaluationsBase, payload);
  }

  updateEvaluation(id: number, payload: Partial<PsychopedagogicalEvaluation>): Observable<PsychopedagogicalEvaluation> {
    return this.apiClient.put<PsychopedagogicalEvaluation>(API_ENDPOINTS.psychopedagogy.evaluationById(id), payload);
  }

  deleteEvaluation(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.psychopedagogy.evaluationById(id));
  }

  listSessions(evaluationId: number): Observable<InterventionSession[]> {
    return this.apiClient
      .get<SessionsResponse<InterventionSession>>(
        API_ENDPOINTS.psychopedagogy.evaluationSessions(evaluationId)
      )
      .pipe(map((response) => this.mapSessions(response)));
  }

  listSessionsByPatientHistory(patientId: number): Observable<InterventionSession[]> {
    return this.apiClient
      .get<SessionsResponse<InterventionSession>>(
        API_ENDPOINTS.psychopedagogy.sessionsByPatientHistory(patientId)
      )
      .pipe(map((response) => this.mapSessions(response)));
  }

  getSession(id: number): Observable<InterventionSession> {
    return this.apiClient.get<InterventionSession>(API_ENDPOINTS.psychopedagogy.sessionById(id));
  }

  createSession(payload: InterventionSessionCreate): Observable<InterventionSession> {
    return this.apiClient.post<InterventionSession>(API_ENDPOINTS.psychopedagogy.sessionsBase, payload);
  }

  updateSession(id: number, payload: Partial<InterventionSession>): Observable<InterventionSession> {
    return this.apiClient.put<InterventionSession>(API_ENDPOINTS.psychopedagogy.sessionById(id), payload);
  }

  deleteSession(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.psychopedagogy.sessionById(id));
  }

  private mapEvaluations(
    response: EvaluationsResponse<PsychopedagogicalEvaluation>
  ): PsychopedagogicalEvaluation[] {
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

  private mapSessions(response: SessionsResponse<InterventionSession>): InterventionSession[] {
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
