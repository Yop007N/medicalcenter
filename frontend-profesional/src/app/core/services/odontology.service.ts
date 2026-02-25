import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

type CollectionEnvelope<T> = {
  items?: T[];
  odontograms?: T[];
  treatments?: T[];
};

type CollectionResponse<T> = T[] | CollectionEnvelope<T>;

type TeethResponse = {
  teeth?: Tooth[];
};

type CompleteTreatmentResponse = {
  treatment?: DentalTreatment;
};

export type ToothStatus =
  | 'healthy'
  | 'caries'
  | 'filled'
  | 'crown'
  | 'implant'
  | 'missing'
  | 'root_canal'
  | 'fractured'
  | 'mobile'
  | 'to_extract'
  | 'extracted';

export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

export interface Tooth {
  id: number;
  odontogram_id: number;
  tooth_number: number;
  tooth_type?: 'permanent' | 'deciduous';
  status: ToothStatus;
  mesial?: string;
  distal?: string;
  oclusal?: string;
  vestibular?: string;
  lingual?: string;
  notes?: string;
  planned_treatment?: string;
  sensitivity?: string;
  mobility?: number;
  gingival_status?: string;
  pocket_depth?: number;
}

export interface Odontogram {
  id: number;
  patient_id: number;
  professional_id: number;
  notes?: string;
  is_active: boolean;
  teeth?: Tooth[];
  created_at?: string;
  updated_at?: string;
}

export interface DentalTreatment {
  id: number;
  patient_id: number;
  professional_id: number;
  treatment_type: string;
  treatment_date: string;
  affected_teeth?: number[];
  description?: string;
  status: TreatmentStatus;
  estimated_cost?: string | number;
  final_cost?: string | number;
  post_treatment_notes?: string;
  completion_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OdontogramPayload {
  patient_id: number;
  notes?: string;
}

export interface ToothUpsertPayload {
  status?: ToothStatus;
  notes?: string;
  planned_treatment?: string;
  mesial?: string;
  distal?: string;
  oclusal?: string;
  vestibular?: string;
  lingual?: string;
}

export interface DentalTreatmentPayload {
  patient_id: number;
  treatment_type: string;
  treatment_date: string;
  affected_teeth?: number[];
  description?: string;
  estimated_cost?: number;
  status?: TreatmentStatus;
}

export interface DentalTreatmentFilters {
  [key: string]: string | number | undefined;
  patient_id?: number;
  professional_id?: number;
  treatment_type?: string;
  status?: TreatmentStatus;
  date_from?: string;
  date_to?: string;
}

function mapCollectionItems<T>(
  response: CollectionResponse<T>,
  keys: ReadonlyArray<keyof CollectionEnvelope<T>> = ['items']
): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  for (const key of keys) {
    const value = response[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

@Injectable({
  providedIn: 'root'
})
export class OdontologyService {
  constructor(private api: ApiService) {}

  listOdontograms(patientId?: number): Observable<Odontogram[]> {
    const params = typeof patientId === 'number' ? { patient_id: patientId } : undefined;
    return this.api
      .get<CollectionResponse<Odontogram>>(API_ENDPOINTS.odontology.odontogramsBase, params)
      .pipe(map((response) => mapCollectionItems(response, ['items', 'odontograms'])));
  }

  getPatientOdontogram(patientId: number): Observable<Odontogram> {
    return this.api.get<Odontogram>(API_ENDPOINTS.odontology.patientOdontogram(patientId));
  }

  createOdontogram(payload: OdontogramPayload): Observable<Odontogram> {
    return this.api.post<Odontogram>(API_ENDPOINTS.odontology.odontogramsBase, payload);
  }

  updateOdontogram(odontogramId: number, payload: Partial<OdontogramPayload>): Observable<Odontogram> {
    return this.api.put<Odontogram>(API_ENDPOINTS.odontology.odontogramById(odontogramId), payload);
  }

  listTeeth(odontogramId: number): Observable<Tooth[]> {
    return this.api
      .get<TeethResponse>(API_ENDPOINTS.odontology.teethByOdontogram(odontogramId))
      .pipe(map((response) => response.teeth ?? []));
  }

  saveTooth(odontogramId: number, toothNumber: number, payload: ToothUpsertPayload): Observable<Tooth> {
    return this.api.put<Tooth>(API_ENDPOINTS.odontology.toothByNumber(odontogramId, toothNumber), payload);
  }

  listTreatments(filters?: DentalTreatmentFilters): Observable<DentalTreatment[]> {
    return this.api
      .get<CollectionResponse<DentalTreatment>>(API_ENDPOINTS.odontology.treatmentsBase, filters)
      .pipe(map((response) => mapCollectionItems(response, ['items', 'treatments'])));
  }

  createTreatment(payload: DentalTreatmentPayload): Observable<DentalTreatment> {
    return this.api.post<DentalTreatment>(API_ENDPOINTS.odontology.treatmentsBase, payload);
  }

  updateTreatment(treatmentId: number, payload: Partial<DentalTreatmentPayload>): Observable<DentalTreatment> {
    return this.api.put<DentalTreatment>(API_ENDPOINTS.odontology.treatmentById(treatmentId), payload);
  }

  completeTreatment(
    treatmentId: number,
    payload: { completion_notes?: string; final_cost?: number; treatment_success?: boolean } = {}
  ): Observable<DentalTreatment> {
    return this.api
      .post<CompleteTreatmentResponse>(API_ENDPOINTS.odontology.treatmentComplete(treatmentId), payload)
      .pipe(
        map((response) => {
          if (!response.treatment) {
            throw new Error('Unexpected response while completing treatment');
          }
          return response.treatment;
        })
      );
  }

  cancelTreatment(
    treatmentId: number,
    payload: { cancellation_reason?: string } = {}
  ): Observable<DentalTreatment> {
    return this.api.post<DentalTreatment>(API_ENDPOINTS.odontology.treatmentCancel(treatmentId), payload);
  }

  deleteTreatment(treatmentId: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.odontology.treatmentById(treatmentId));
  }
}
