import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { CollectionResponse, mapCollectionItems } from '../api/collection-response.util';
import { Patient } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  constructor(private readonly api: ApiService) {}

  getPatients(filters?: { search?: string; q?: string }): Observable<Patient[]> {
    return this.api
      .get<CollectionResponse<Patient>>(API_ENDPOINTS.patients.base, filters)
      .pipe(mapCollectionItems<Patient>());
  }

  getPatientById(id: number): Observable<Patient> {
    return this.api.get<Patient>(API_ENDPOINTS.patients.byId(id));
  }
}
