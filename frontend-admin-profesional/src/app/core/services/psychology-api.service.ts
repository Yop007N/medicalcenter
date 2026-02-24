import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  PsychologicalEvaluation,
  PsychologicalEvaluationCreate,
  TherapySession,
  TherapySessionCreate
} from '../../models/psychology.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];

@Injectable({ providedIn: 'root' })
export class PsychologyApiService {
  private apiClient = inject(ApiClientService);

  listEvaluations(patientId?: number): Observable<PsychologicalEvaluation[]> {
    return this.apiClient
      .get<CollectionResponse<PsychologicalEvaluation>>(API_ENDPOINTS.psychology.evaluationsBase, {
        patient_id: patientId
      })
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
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
      .get<CollectionResponse<TherapySession>>(API_ENDPOINTS.psychology.evaluationSessions(evaluationId))
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
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
}
