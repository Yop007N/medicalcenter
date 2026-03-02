import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Appointment, Budget, Patient } from '../../models';
import { MedicalRecord } from '../../models/medical-record.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];
type PatientListFilters = {
  specialty_key?: string;
};

@Injectable({ providedIn: 'root' })
export class PatientsApiService {
  private apiClient = inject(ApiClientService);

  list(filters?: PatientListFilters): Observable<Patient[]> {
    return this.apiClient
      .get<CollectionResponse<Patient>>(API_ENDPOINTS.patients.base, filters)
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  getById(id: number): Observable<Patient> {
    return this.apiClient.get<Patient>(API_ENDPOINTS.patients.byId(id));
  }

  create(payload: Partial<Patient>): Observable<Patient> {
    return this.apiClient.post<Patient>(API_ENDPOINTS.patients.base, payload);
  }

  update(id: number, payload: Partial<Patient>): Observable<Patient> {
    return this.apiClient.put<Patient>(API_ENDPOINTS.patients.byId(id), payload);
  }

  delete(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.patients.byId(id));
  }

  listAppointments(id: number): Observable<Appointment[]> {
    return this.apiClient
      .get<CollectionResponse<Appointment>>(API_ENDPOINTS.patients.appointments(id))
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  listMedicalRecords(id: number): Observable<MedicalRecord[]> {
    return this.apiClient
      .get<CollectionResponse<MedicalRecord>>(API_ENDPOINTS.patients.medicalRecords(id))
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  listBudgets(id: number): Observable<Budget[]> {
    return this.apiClient
      .get<CollectionResponse<Budget>>(API_ENDPOINTS.patients.budgets(id))
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }
}
