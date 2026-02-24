import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  InterventionSession,
  InterventionSessionCreate,
  PsychopedagogicalEvaluation,
  PsychopedagogicalEvaluationCreate
} from '../../models/psychopedagogy.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];

@Injectable({ providedIn: 'root' })
export class PsychopedagogyApiService {
  private apiClient = inject(ApiClientService);

  listEvaluations(patientId?: number): Observable<PsychopedagogicalEvaluation[]> {
    return this.apiClient
      .get<CollectionResponse<PsychopedagogicalEvaluation>>(API_ENDPOINTS.psychopedagogy.evaluationsBase, {
        patient_id: patientId
      })
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
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
      .get<CollectionResponse<InterventionSession>>(API_ENDPOINTS.psychopedagogy.evaluationSessions(evaluationId))
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
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
}
