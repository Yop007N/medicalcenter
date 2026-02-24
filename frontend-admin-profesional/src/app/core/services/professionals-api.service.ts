import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Appointment, Professional } from '../../models';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];

@Injectable({ providedIn: 'root' })
export class ProfessionalsApiService {
  private apiClient = inject(ApiClientService);

  list(): Observable<Professional[]> {
    return this.apiClient
      .get<CollectionResponse<Professional>>(API_ENDPOINTS.professionals.base)
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  getById(id: number): Observable<Professional> {
    return this.apiClient.get<Professional>(API_ENDPOINTS.professionals.byId(id));
  }

  create(payload: Partial<Professional>): Observable<Professional> {
    return this.apiClient.post<Professional>(API_ENDPOINTS.professionals.base, payload);
  }

  update(id: number, payload: Partial<Professional>): Observable<Professional> {
    return this.apiClient.put<Professional>(API_ENDPOINTS.professionals.byId(id), payload);
  }

  delete(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.professionals.byId(id));
  }

  listAppointments(id: number): Observable<Appointment[]> {
    return this.apiClient
      .get<CollectionResponse<Appointment>>(API_ENDPOINTS.professionals.appointments(id))
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }
}
