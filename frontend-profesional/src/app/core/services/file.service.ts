import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

export interface ClinicalFile {
  id: number;
  patient_id: number | null;
  uploaded_by: number;
  filename: string;
  original_filename: string;
  file_type: string;
  category: string;
  file_size: number;
  description: string;
  medical_record_id: number;
  is_private: boolean;
  created_at: string | null;
  upload_date: string | null;
}

export interface UploadFilePayload {
  file: File;
  medicalRecordId: number;
  fileType: string;
  description?: string;
  patientId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  constructor(private api: ApiService) {}

  listFiles(filters?: { patient_id?: number; specialty_key?: string }): Observable<ClinicalFile[]> {
    return this.api.get<ClinicalFile[]>(API_ENDPOINTS.files.base, filters);
  }

  uploadFile(payload: UploadFilePayload): Observable<ClinicalFile> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('medical_record_id', String(payload.medicalRecordId));
    formData.append('file_type', payload.fileType);
    if (payload.description?.trim()) {
      formData.append('description', payload.description.trim());
    }
    if (payload.patientId) {
      formData.append('patient_id', String(payload.patientId));
    }

    return this.api.post<ClinicalFile>(API_ENDPOINTS.files.upload, formData);
  }

  downloadFile(fileId: number): Observable<Blob> {
    return this.api.getBlob(API_ENDPOINTS.files.download(fileId));
  }

  deleteFile(fileId: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.files.byId(fileId));
  }
}
