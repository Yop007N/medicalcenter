import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { SpecialtyModuleDefinition } from '../auth/specialty-access.service';

export interface SpecialtyModuleContext {
  actor: string;
  user_id: number;
  specialty: string | null;
  module: SpecialtyModuleDefinition;
}

export interface SpecialtyModuleOverview {
  actor: string;
  specialty: string | null;
  module: SpecialtyModuleDefinition;
  totals: {
    patients: number;
    patients_active: number;
    appointments_total: number;
    appointments_upcoming: number;
    medical_records: number;
    budgets: number;
    payments_completed: number;
    revenue_completed: number;
    currency: string;
  };
  upcoming_appointments: Array<{
    id: number;
    patient_id: number;
    patient_name: string;
    status: string;
    appointment_type: string | null;
    appointment_date: string;
  }>;
  recent_medical_records: Array<{
    id: number;
    patient_id: number;
    patient_name: string;
    record_date: string | null;
    diagnosis: string | null;
    treatment: string | null;
  }>;
  patients: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
  }>;
  generated_at: string;
}

export interface SpecialtyEncounter {
  id: number;
  patient_id: number;
  patient_name: string | null;
  professional_id: number;
  specialty_key: string;
  visit_date: string;
  status: 'open' | 'in_progress' | 'closed';
  chief_complaint: string;
  diagnosis: string | null;
  assessment: string | null;
  plan: string | null;
  notes: string | null;
  vitals: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
}

export interface CreateSpecialtyEncounterPayload {
  patient_id: number;
  specialty_key: string;
  visit_date: string;
  status?: 'open' | 'in_progress' | 'closed';
  chief_complaint: string;
  diagnosis?: string;
  assessment?: string;
  plan?: string;
  notes?: string;
  vitals?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

export interface UpdateSpecialtyEncounterPayload
  extends Partial<CreateSpecialtyEncounterPayload> {}

@Injectable({
  providedIn: 'root'
})
export class SpecialtyModuleService {
  constructor(private readonly api: ApiService) {}

  getCatalog(): Observable<SpecialtyModuleDefinition[]> {
    return this.api.get<SpecialtyModuleDefinition[]>(API_ENDPOINTS.specialties.catalog);
  }

  getMyModule(): Observable<SpecialtyModuleContext> {
    return this.api.get<SpecialtyModuleContext>(API_ENDPOINTS.specialties.myModule);
  }

  getMyModuleOverview(): Observable<SpecialtyModuleOverview> {
    return this.api.get<SpecialtyModuleOverview>(API_ENDPOINTS.specialties.myModuleOverview);
  }

  listEncounters(params?: {
    specialty_key?: string;
    patient_id?: number;
  }): Observable<SpecialtyEncounter[]> {
    return this.api.get<SpecialtyEncounter[]>(API_ENDPOINTS.specialties.encounters, params);
  }

  createEncounter(payload: CreateSpecialtyEncounterPayload): Observable<SpecialtyEncounter> {
    return this.api.post<SpecialtyEncounter>(API_ENDPOINTS.specialties.encounters, payload);
  }

  updateEncounter(
    encounterId: number,
    payload: UpdateSpecialtyEncounterPayload
  ): Observable<SpecialtyEncounter> {
    return this.api.put<SpecialtyEncounter>(API_ENDPOINTS.specialties.encounterById(encounterId), payload);
  }

  deleteEncounter(encounterId: number): Observable<{ msg: string }> {
    return this.api.delete<{ msg: string }>(API_ENDPOINTS.specialties.encounterById(encounterId));
  }
}
