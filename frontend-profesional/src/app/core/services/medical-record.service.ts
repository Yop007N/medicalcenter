import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { MedicalRecord } from '../../shared/models/medical-record.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  constructor(private api: ApiService) {}

  getMedicalRecords(filters?: any): Observable<MedicalRecord[]> {
    return this.api.get<MedicalRecord[]>('medical-records', filters);
  }

  getMedicalRecordById(id: number): Observable<MedicalRecord> {
    return this.api.get<MedicalRecord>(`medical-records/${id}`);
  }

  createMedicalRecord(record: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.api.post<MedicalRecord>('medical-records', record);
  }

  updateMedicalRecord(id: number, record: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.api.put<MedicalRecord>(`medical-records/${id}`, record);
  }

  deleteMedicalRecord(id: number): Observable<void> {
    return this.api.delete<void>(`medical-records/${id}`);
  }
}
