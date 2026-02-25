import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { CollectionResponse, mapCollectionItems } from '../api/collection-response.util';
import { Professional } from '../../shared/models/user.model';

export interface CreateProfessionalPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  license_number: string;
  specialty?: string | null;
  phone?: string | null;
  address?: string | null;
}

export type UpdateProfessionalPayload = Partial<CreateProfessionalPayload>;

@Injectable({
  providedIn: 'root'
})
export class ProfessionalService {
  constructor(private readonly api: ApiService) {}

  getProfessionals(filters?: { specialty?: string }): Observable<Professional[]> {
    return this.api
      .get<CollectionResponse<Professional>>(API_ENDPOINTS.professionals.base, filters)
      .pipe(mapCollectionItems<Professional>());
  }

  getProfessionalById(id: number): Observable<Professional> {
    return this.api.get<Professional>(API_ENDPOINTS.professionals.byId(id));
  }

  createProfessional(payload: CreateProfessionalPayload): Observable<Professional> {
    return this.api.post<Professional>(API_ENDPOINTS.professionals.base, payload);
  }

  updateProfessional(id: number, payload: UpdateProfessionalPayload): Observable<Professional> {
    return this.api.put<Professional>(API_ENDPOINTS.professionals.byId(id), payload);
  }
}
