import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  constructor(private api: ApiService) {}

  uploadFile(file: File, medicalRecordId: number, fileType: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('medical_record_id', medicalRecordId.toString());
    formData.append('file_type', fileType);

    return this.api.post(API_ENDPOINTS.files.upload, formData);
  }

  downloadFile(fileId: number): Observable<Blob> {
    return this.api.getBlob(API_ENDPOINTS.files.download(fileId));
  }

  deleteFile(fileId: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.files.byId(fileId));
  }
}
