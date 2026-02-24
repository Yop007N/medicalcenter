import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  DentalTreatment,
  DentalTreatmentCreate,
  DentalTreatmentUpdate,
  Odontogram,
  OdontogramCreate,
  Tooth,
  ToothUpdate
} from '../../models/odontology.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];

@Injectable({ providedIn: 'root' })
export class OdontologyApiService {
  private apiClient = inject(ApiClientService);

  listOdontograms(patientId: number): Observable<Odontogram[]> {
    return this.apiClient
      .get<CollectionResponse<Odontogram>>(API_ENDPOINTS.odontology.odontogramsBase, {
        patient_id: patientId
      })
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  getOdontogram(id: number): Observable<Odontogram> {
    return this.apiClient.get<Odontogram>(API_ENDPOINTS.odontology.odontogramById(id));
  }

  createOdontogram(payload: OdontogramCreate): Observable<Odontogram> {
    return this.apiClient.post<Odontogram>(API_ENDPOINTS.odontology.odontogramsBase, payload);
  }

  updateTooth(odontogramId: number, toothNumber: number, payload: ToothUpdate): Observable<Tooth> {
    return this.apiClient.put<Tooth>(API_ENDPOINTS.odontology.toothByNumber(odontogramId, toothNumber), payload);
  }

  listDentalTreatments(patientId?: number): Observable<DentalTreatment[]> {
    return this.apiClient
      .get<CollectionResponse<DentalTreatment>>(API_ENDPOINTS.odontology.treatmentsBase, {
        patient_id: patientId
      })
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  getDentalTreatment(id: number): Observable<DentalTreatment> {
    return this.apiClient.get<DentalTreatment>(API_ENDPOINTS.odontology.treatmentById(id));
  }

  createDentalTreatment(payload: DentalTreatmentCreate): Observable<DentalTreatment> {
    return this.apiClient.post<DentalTreatment>(API_ENDPOINTS.odontology.treatmentsBase, payload);
  }

  updateDentalTreatment(id: number, payload: DentalTreatmentUpdate): Observable<DentalTreatment> {
    return this.apiClient.put<DentalTreatment>(API_ENDPOINTS.odontology.treatmentById(id), payload);
  }

  deleteDentalTreatment(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.odontology.treatmentById(id));
  }
}
