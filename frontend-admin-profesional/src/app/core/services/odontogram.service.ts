import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ToothStatus } from '../../models/odontology.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

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
  private apiClient = inject(ApiClientService);

  getOdontograms(patientId?: number): Observable<Odontogram[]> {
    return this.apiClient.get<Odontogram[]>(API_ENDPOINTS.odontology.odontogramsBase, {
      patient_id: patientId
    });
  }

  getPatientOdontogram(patientId: number): Observable<Odontogram> {
    return this.apiClient.get<Odontogram>(API_ENDPOINTS.odontology.patientOdontogram(patientId));
  }

  getOdontogram(odontogramId: number): Observable<Odontogram> {
    return this.apiClient.get<Odontogram>(API_ENDPOINTS.odontology.odontogramById(odontogramId));
  }

  createOdontogram(data: Partial<Odontogram>): Observable<Odontogram> {
    return this.apiClient.post<Odontogram>(API_ENDPOINTS.odontology.odontogramsBase, data);
  }

  updateOdontogram(odontogramId: number, data: Partial<Odontogram>): Observable<Odontogram> {
    return this.apiClient.put<Odontogram>(API_ENDPOINTS.odontology.odontogramById(odontogramId), data);
  }

  getTeeth(odontogramId: number): Observable<{ teeth: Tooth[] }> {
    return this.apiClient.get<{ teeth: Tooth[] }>(API_ENDPOINTS.odontology.teethByOdontogram(odontogramId));
  }

  getTooth(odontogramId: number, toothNumber: number): Observable<Tooth> {
    return this.apiClient.get<Tooth>(API_ENDPOINTS.odontology.toothByOdontogramAndNumber(odontogramId, toothNumber));
  }

  saveTooth(odontogramId: number, toothData: Partial<Tooth>): Observable<Tooth> {
    return this.apiClient.post<Tooth>(API_ENDPOINTS.odontology.toothBaseByOdontogram(odontogramId), toothData);
  }

  deleteTooth(odontogramId: number, toothNumber: number): Observable<{ msg: string }> {
    return this.apiClient.delete<{ msg: string }>(
      API_ENDPOINTS.odontology.toothByOdontogramAndNumber(odontogramId, toothNumber)
    );
  }
}
