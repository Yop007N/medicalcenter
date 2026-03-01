import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { MedicalFile, MedicalRecord, MedicalRecordCreate } from '../../models/medical-record.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];

@Injectable({ providedIn: 'root' })
export class MedicalRecordsApiService {
  private apiClient = inject(ApiClientService);

  list(patientId?: number, professionalId?: number, specialtyKey?: string): Observable<MedicalRecord[]> {
    return this.apiClient
      .get<CollectionResponse<MedicalRecord>>(API_ENDPOINTS.medicalRecords.base, {
        patient_id: patientId,
        professional_id: professionalId,
        specialty_key: specialtyKey
      })
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  getById(id: number): Observable<MedicalRecord> {
    return this.apiClient.get<MedicalRecord>(API_ENDPOINTS.medicalRecords.byId(id));
  }

  create(payload: MedicalRecordCreate): Observable<MedicalRecord> {
    return this.apiClient.post<MedicalRecord>(API_ENDPOINTS.medicalRecords.base, payload);
  }

  update(id: number, payload: Partial<MedicalRecordCreate>): Observable<MedicalRecord> {
    return this.apiClient.put<MedicalRecord>(API_ENDPOINTS.medicalRecords.byId(id), payload);
  }

  delete(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.medicalRecords.byId(id));
  }

  uploadFile(medicalRecordId: number, file: File, fileType?: string, description?: string): Observable<MedicalFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('medical_record_id', String(medicalRecordId));

    if (fileType) {
      formData.append('file_type', fileType);
    }
    if (description) {
      formData.append('description', description);
    }

    return this.apiClient.post<MedicalFile>(API_ENDPOINTS.files.upload, formData);
  }

  deleteFile(fileId: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.files.byId(fileId));
  }
}
