import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Budget } from '../../models/budget.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];

@Injectable({ providedIn: 'root' })
export class BudgetsApiService {
  private apiClient = inject(ApiClientService);

  list(patientId?: number, specialtyKey?: string): Observable<Budget[]> {
    return this.apiClient
      .get<CollectionResponse<Budget>>(API_ENDPOINTS.budgets.base, {
        patient_id: patientId,
        specialty_key: specialtyKey
      })
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  getById(id: number): Observable<Budget> {
    return this.apiClient.get<Budget>(API_ENDPOINTS.budgets.byId(id));
  }

  create(payload: Partial<Budget>): Observable<Budget> {
    return this.apiClient.post<Budget>(API_ENDPOINTS.budgets.base, payload);
  }

  update(id: number, payload: Partial<Budget>): Observable<Budget> {
    return this.apiClient.put<Budget>(API_ENDPOINTS.budgets.byId(id), payload);
  }

  delete(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.budgets.byId(id));
  }

  send(id: number): Observable<Budget> {
    return this.apiClient.post<Budget>(API_ENDPOINTS.budgets.send(id), {});
  }

  accept(id: number): Observable<Budget> {
    return this.apiClient.post<Budget>(API_ENDPOINTS.budgets.accept(id), {});
  }
}
