import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { FileUpload, MedicalFile } from '../../models/file.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionResponse<T> = { items?: T[] } | T[];

@Injectable({ providedIn: 'root' })
export class FilesApiService {
  private apiClient = inject(ApiClientService);

  list(patientId?: number, specialtyKey?: string): Observable<MedicalFile[]> {
    return this.apiClient
      .get<CollectionResponse<MedicalFile>>(API_ENDPOINTS.files.base, {
        patient_id: patientId,
        specialty_key: specialtyKey
      })
      .pipe(map((response) => (Array.isArray(response) ? response : response.items ?? [])));
  }

  getById(id: number): Observable<MedicalFile> {
    return this.apiClient.get<MedicalFile>(API_ENDPOINTS.files.byId(id));
  }

  upload(file: File, metadata: FileUpload): Observable<MedicalFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', String(metadata.patient_id));
    formData.append('category', metadata.category);
    if (metadata.specialty_key) {
      formData.append('specialty_key', metadata.specialty_key);
    }

    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.is_private !== undefined) {
      formData.append('is_private', String(metadata.is_private));
    }
    if (metadata.medical_record_id) {
      formData.append('medical_record_id', String(metadata.medical_record_id));
    }
    if (metadata.appointment_id) {
      formData.append('appointment_id', String(metadata.appointment_id));
    }

    return this.apiClient.post<MedicalFile>(API_ENDPOINTS.files.upload, formData);
  }

  delete(id: number): Observable<void> {
    return this.apiClient.delete<void>(API_ENDPOINTS.files.byId(id));
  }

  download(id: number): Observable<Blob> {
    return this.apiClient.getBlob(API_ENDPOINTS.files.download(id));
  }
}
