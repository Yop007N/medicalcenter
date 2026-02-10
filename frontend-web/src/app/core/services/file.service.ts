import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class FileService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadFile(
    file: File,
    medicalRecordId: number,
    fileType: string,
  ): Observable<any> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("medical_record_id", medicalRecordId.toString());
    formData.append("file_type", fileType);

    return this.http.post(`${this.API_URL}/files/upload`, formData);
  }

  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/files/${fileId}/download`, {
      responseType: "blob",
    });
  }

  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/files/${fileId}`);
  }
}
