import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { MedicalRecord } from '../../shared/models/medical-record.model';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { CollectionResponse, mapCollectionItems } from '../api/collection-response.util';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  constructor(private api: ApiService) {}

  getMedicalRecords(filters?: {
    patient_id?: number;
    professional_id?: number;
    specialty_key?: string;
  }): Observable<MedicalRecord[]> {
    return this.api
      .get<CollectionResponse<MedicalRecord>>(API_ENDPOINTS.medicalRecords.base, filters)
      .pipe(mapCollectionItems<MedicalRecord>());
  }

  getMedicalRecordById(id: number): Observable<MedicalRecord> {
    return this.api.get<MedicalRecord>(API_ENDPOINTS.medicalRecords.byId(id));
  }

  createMedicalRecord(record: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.api.post<MedicalRecord>(API_ENDPOINTS.medicalRecords.base, record);
  }

  updateMedicalRecord(id: number, record: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.api.put<MedicalRecord>(API_ENDPOINTS.medicalRecords.byId(id), record);
  }

  deleteMedicalRecord(id: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.medicalRecords.byId(id));
  }
}
