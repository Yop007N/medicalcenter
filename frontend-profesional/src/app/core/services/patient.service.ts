import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { CollectionResponse, mapCollectionItems } from '../api/collection-response.util';
import { Patient } from '../../shared/models/user.model';

export interface CreatePatientPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  phone?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  medical_history?: string | null;
}

export type UpdatePatientPayload = Partial<CreatePatientPayload>;

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  constructor(private readonly api: ApiService) {}

  getPatients(filters?: { search?: string; q?: string; specialty_key?: string }): Observable<Patient[]> {
    return this.api
      .get<CollectionResponse<Patient>>(API_ENDPOINTS.patients.base, filters)
      .pipe(mapCollectionItems<Patient>());
  }

  getPatientById(id: number): Observable<Patient> {
    return this.api.get<Patient>(API_ENDPOINTS.patients.byId(id));
  }

  createPatient(payload: CreatePatientPayload): Observable<Patient> {
    return this.api.post<Patient>(API_ENDPOINTS.patients.base, payload);
  }

  updatePatient(id: number, payload: UpdatePatientPayload): Observable<Patient> {
    return this.api.put<Patient>(API_ENDPOINTS.patients.byId(id), payload);
  }
}
