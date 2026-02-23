import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToothStatus } from '../../models/odontology.model';

export interface Tooth {
  id?: number;
  odontogram_id?: number;
  tooth_number: number;
  tooth_type: 'permanent' | 'deciduous';
  status: ToothStatus;
  mesial?: string;
  distal?: string;
  oclusal?: string;
  vestibular?: string;
  lingual?: string;
  notes?: string;
  sensitivity?: number;
  mobility?: number;
  gingival_status?: string;
  pocket_depth?: number;
  planned_treatment?: string;
  treatment_priority?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Odontogram {
  id?: number;
  patient_id: number;
  professional_id?: number;
  notes?: string;
  is_active: boolean;
  teeth?: Tooth[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class OdontogramService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/odontograms`;

  // Get all odontograms, optionally filtered by patient
  getOdontograms(patientId?: number): Observable<Odontogram[]> {
    const url = patientId ? `${this.baseUrl}?patient_id=${patientId}` : this.baseUrl;
    return this.http.get<Odontogram[]>(url);
  }

  // Get active odontogram for a patient
  getPatientOdontogram(patientId: number): Observable<Odontogram> {
    return this.http.get<Odontogram>(`${this.baseUrl}/patient/${patientId}`);
  }

  // Get specific odontogram by ID
  getOdontogram(odontogramId: number): Observable<Odontogram> {
    return this.http.get<Odontogram>(`${this.baseUrl}/${odontogramId}`);
  }

  // Create new odontogram
  createOdontogram(data: Partial<Odontogram>): Observable<Odontogram> {
    return this.http.post<Odontogram>(this.baseUrl, data);
  }

  // Update odontogram
  updateOdontogram(odontogramId: number, data: Partial<Odontogram>): Observable<Odontogram> {
    return this.http.put<Odontogram>(`${this.baseUrl}/${odontogramId}`, data);
  }

  // Get all teeth for an odontogram
  getTeeth(odontogramId: number): Observable<{ teeth: Tooth[] }> {
    return this.http.get<{ teeth: Tooth[] }>(`${this.baseUrl}/${odontogramId}/teeth`);
  }

  // Get specific tooth
  getTooth(odontogramId: number, toothNumber: number): Observable<Tooth> {
    return this.http.get<Tooth>(`${this.baseUrl}/${odontogramId}/tooth/${toothNumber}`);
  }

  // Add or update tooth
  saveTooth(odontogramId: number, toothData: Partial<Tooth>): Observable<Tooth> {
    return this.http.post<Tooth>(`${this.baseUrl}/${odontogramId}/tooth`, toothData);
  }

  // Delete tooth
  deleteTooth(odontogramId: number, toothNumber: number): Observable<{ msg: string }> {
    return this.http.delete<{ msg: string }>(`${this.baseUrl}/${odontogramId}/tooth/${toothNumber}`);
  }
}
