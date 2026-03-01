import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Appointment } from '../../models';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];

@Injectable({ providedIn: 'root' })
export class AppointmentsApiService {
  private apiClient = inject(ApiClientService);

  list(patientId?: number, professionalId?: number, specialtyKey?: string): Observable<Appointment[]> {
    return this.apiClient
      .get<CollectionResponse<Appointment>>(API_ENDPOINTS.appointments.base, {
        patient_id: patientId,
        professional_id: professionalId,
        specialty_key: specialtyKey
      })
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  getById(id: number): Observable<Appointment> {
    return this.apiClient.get<Appointment>(API_ENDPOINTS.appointments.byId(id));
  }

  create(payload: Partial<Appointment>): Observable<Appointment> {
    return this.apiClient.post<Appointment>(API_ENDPOINTS.appointments.base, payload);
  }

  update(id: number, payload: Partial<Appointment>): Observable<Appointment> {
    return this.apiClient.put<Appointment>(API_ENDPOINTS.appointments.byId(id), payload);
  }

  delete(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.appointments.byId(id));
  }

  confirm(id: number): Observable<Appointment> {
    return this.apiClient.post<Appointment>(API_ENDPOINTS.appointments.confirm(id), {});
  }

  cancel(id: number, reason: string): Observable<Appointment> {
    return this.apiClient.put<Appointment>(API_ENDPOINTS.appointments.byId(id), {
      status: 'cancelled',
      notes: reason
    });
  }

  complete(id: number): Observable<Appointment> {
    return this.apiClient.put<Appointment>(API_ENDPOINTS.appointments.byId(id), {
      status: 'completed'
    });
  }
}
