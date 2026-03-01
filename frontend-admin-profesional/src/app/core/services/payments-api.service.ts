import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Payment } from '../../models/budget.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private apiClient = inject(ApiClientService);

  list(budgetId?: number, patientId?: number, specialtyKey?: string): Observable<Payment[]> {
    return this.apiClient
      .get<CollectionResponse<Payment>>(API_ENDPOINTS.payments.base, {
        budget_id: budgetId,
        patient_id: patientId,
        specialty_key: specialtyKey
      })
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  getById(id: number): Observable<Payment> {
    return this.apiClient.get<Payment>(API_ENDPOINTS.payments.byId(id));
  }

  create(payload: Partial<Payment>): Observable<Payment> {
    return this.apiClient.post<Payment>(API_ENDPOINTS.payments.base, payload);
  }

  update(id: number, payload: Partial<Payment>): Observable<Payment> {
    return this.apiClient.put<Payment>(API_ENDPOINTS.payments.byId(id), payload);
  }

  delete(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.payments.byId(id));
  }

  process(id: number): Observable<Payment> {
    return this.apiClient.post<Payment>(API_ENDPOINTS.payments.process(id), {});
  }
}
