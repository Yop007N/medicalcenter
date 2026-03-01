import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiClientService } from './api-client.service';
import { API_ENDPOINTS } from './api-endpoints';

export interface PatientProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  date_of_birth?: string | null;
  phone?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  medical_history?: string | null;
}

export interface PatientAppointment {
  id: number;
  appointment_date: string;
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  appointment_type?: string | null;
  reason?: string | null;
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
    specialty?: string | null;
  };
}

export interface ProfessionalDirectoryItem {
  id: number;
  first_name: string;
  last_name: string;
  specialty?: string | null;
  email?: string;
}

export interface ProfessionalAvailabilityItem extends ProfessionalDirectoryItem {
  next_available_slot: string;
  available_slots: string[];
  available_count: number;
}

export interface SpecialtyCatalogItem {
  key: string;
  label: string;
  description?: string | null;
  route?: string | null;
}

export interface PatientSpecialtyOverview {
  actor: string;
  specialty: string | null;
  module: SpecialtyCatalogItem;
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
  generated_at: string;
}

export interface PatientSpecialtyHistory {
  actor: string;
  specialty: string | null;
  module: SpecialtyCatalogItem;
  filters: {
    specialty_key: string | null;
    patient_id: number | null;
  };
  totals: {
    patients: number;
    appointments: number;
    medical_records: number;
    budgets: number;
    payments: number;
    encounters: number;
    documents: number;
  };
  appointments: Array<{
    id: number;
    patient_id: number;
    patient_name: string;
    professional_id: number;
    professional_name: string;
    status: string;
    appointment_type: string | null;
    appointment_date: string;
  }>;
  medical_records: Array<{
    id: number;
    patient_id: number;
    patient_name: string;
    professional_id: number;
    professional_name: string;
    record_date: string | null;
    diagnosis: string | null;
    treatment: string | null;
    chief_complaint: string | null;
    notes: string | null;
  }>;
  specialty_encounters: Array<{
    id: number;
    specialty_key: string;
    patient_id: number;
    patient_name: string;
    professional_id: number;
    professional_name: string;
    visit_date: string | null;
    status: string;
    chief_complaint: string;
    diagnosis: string | null;
    assessment: string | null;
    plan: string | null;
    notes: string | null;
    vitals: Record<string, unknown> | null;
    payload: Record<string, unknown> | null;
  }>;
  documents: Array<{
    id: number;
    medical_record_id: number;
    patient_id: number | null;
    patient_name: string | null;
    filename: string;
    file_type: string | null;
    description: string | null;
    created_at: string | null;
  }>;
  generated_at: string;
}

export interface CreatePatientAppointmentPayload {
  professional_id: number;
  appointment_date: string;
  appointment_type?: string | null;
  reason?: string | null;
  duration_minutes?: number;
}

export interface PatientOdontogramTooth {
  id: number;
  odontogram_id: number;
  tooth_number: number;
  tooth_type?: string | null;
  status?: string | null;
  mesial?: string | null;
  distal?: string | null;
  oclusal?: string | null;
  vestibular?: string | null;
  lingual?: string | null;
  notes?: string | null;
  planned_treatment?: string | null;
  treatment_priority?: string | null;
}

export interface PatientOdontogram {
  id: number;
  patient_id: number;
  professional_id: number;
  notes?: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  teeth: PatientOdontogramTooth[];
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
    specialty?: string | null;
  };
}

export interface PatientBudget {
  id: number;
  title: string;
  description?: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  total_amount: number;
  currency?: string | null;
  total_paid?: number;
  payments_count?: number;
  valid_until?: string | null;
  created_at: string;
}

export interface PatientMedicalRecord {
  id: number;
  patient_id: number;
  professional_id: number;
  record_date: string;
  chief_complaint?: string | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  prescriptions?: string | null;
  notes?: string | null;
  blood_pressure?: string | null;
  heart_rate?: number | null;
  temperature?: number | null;
  weight?: number | null;
  height?: number | null;
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
    specialty?: string | null;
  };
}

export interface ClinicalCounts {
  evolutions: number;
  prescriptions: number;
  documents: number;
  clinical_documents: number;
  consents_pending: number;
  consents_signed: number;
}

export interface ClinicalHistoryEvent {
  id: number;
  patient_id: number;
  event_type: string;
  reference_type?: string | null;
  reference_id?: number | null;
  title?: string | null;
  description?: string | null;
  event_date: string;
  is_important?: boolean;
}

export interface ClinicalSummary {
  patient_id: number;
  has_anamnesis: boolean;
  medical_alerts: string[];
  counts: ClinicalCounts;
  recent_events: ClinicalHistoryEvent[];
}

export interface PatientDocumentItem {
  id: number;
  patient_id: number;
  document_type: string;
  title?: string | null;
  description?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  document_date?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InformedConsentItem {
  id: number;
  patient_id: number;
  consent_type: string;
  title: string;
  content?: string | null;
  status: 'pending' | 'signed' | 'rejected' | 'annulled';
  patient_signature?: string | null;
  patient_signed_at?: string | null;
  rejected_reason?: string | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientApiService {
  constructor(
    private apiClient: ApiClientService,
    private authService: AuthService
  ) {}

  getCurrentPatientId(): number | null {
    const user = this.authService.currentUserValue;
    return typeof user?.id === 'number' ? user.id : null;
  }

  getMyProfile(): Observable<PatientProfile> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) => this.apiClient.get<PatientProfile>(API_ENDPOINTS.patients.byId(patientId)))
    );
  }

  updateMyProfile(payload: Partial<PatientProfile>): Observable<PatientProfile> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.put<PatientProfile>(API_ENDPOINTS.patients.byId(patientId), payload)
      )
    );
  }

  getMyAppointments(): Observable<PatientAppointment[]> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.get<PatientAppointment[]>(API_ENDPOINTS.patients.appointments(patientId))
      )
    );
  }

  listProfessionals(specialty?: string): Observable<ProfessionalDirectoryItem[]> {
    return this.apiClient.get<ProfessionalDirectoryItem[]>(API_ENDPOINTS.professionals.base, {
      specialty
    });
  }

  listAvailableProfessionals(params?: {
    specialty?: string;
    date_from?: string;
    days?: number;
    slots_per_professional?: number;
  }): Observable<ProfessionalAvailabilityItem[]> {
    return this.apiClient.get<ProfessionalAvailabilityItem[]>(
      API_ENDPOINTS.professionals.availableSlots,
      {
        specialty: params?.specialty,
        date_from: params?.date_from,
        days: params?.days,
        slots_per_professional: params?.slots_per_professional
      }
    );
  }

  createMyAppointment(payload: CreatePatientAppointmentPayload): Observable<PatientAppointment> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.post<PatientAppointment>(API_ENDPOINTS.appointments.base, {
          patient_id: patientId,
          professional_id: payload.professional_id,
          appointment_date: payload.appointment_date,
          appointment_type: payload.appointment_type ?? null,
          reason: payload.reason ?? null,
          duration_minutes: payload.duration_minutes
        })
      )
    );
  }

  cancelMyAppointment(appointmentId: number, reason?: string): Observable<{ msg: string }> {
    return this.apiClient.delete<{ msg: string }>(API_ENDPOINTS.appointments.byId(appointmentId), {
      reason
    });
  }

  getMyBudgets(): Observable<PatientBudget[]> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.get<PatientBudget[]>(API_ENDPOINTS.patients.budgets(patientId))
      )
    );
  }

  getMyMedicalRecords(): Observable<PatientMedicalRecord[]> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.get<PatientMedicalRecord[]>(API_ENDPOINTS.patients.medicalHistory(patientId))
      )
    );
  }

  getMyOdontogram(): Observable<PatientOdontogram> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.get<PatientOdontogram>(API_ENDPOINTS.patients.odontogram(patientId))
      )
    );
  }

  acceptBudget(budgetId: number): Observable<PatientBudget> {
    return this.apiClient.post<PatientBudget>(API_ENDPOINTS.budgets.accept(budgetId), {});
  }

  getMyClinicalSummary(): Observable<ClinicalSummary> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.get<ClinicalSummary>(API_ENDPOINTS.clinicalHistory.summary(patientId))
      )
    );
  }

  getMyClinicalTimeline(limit = 50): Observable<ClinicalHistoryEvent[]> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.get<ClinicalHistoryEvent[]>(
          API_ENDPOINTS.clinicalHistory.timeline,
          {
            patient_id: patientId,
            limit
          }
        )
      )
    );
  }

  getMyClinicalDocuments(): Observable<PatientDocumentItem[]> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.get<PatientDocumentItem[]>(
          API_ENDPOINTS.clinicalHistory.documents,
          { patient_id: patientId }
        )
      )
    );
  }

  downloadClinicalDocument(documentId: number): Observable<Blob> {
    return this.apiClient.download(API_ENDPOINTS.clinicalHistory.documentDownload(documentId));
  }

  getMyConsents(status?: string): Observable<InformedConsentItem[]> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) => {
        const params: Record<string, string | number | boolean | undefined> = {
          patient_id: patientId,
          status
        };
        return this.apiClient.get<InformedConsentItem[]>(API_ENDPOINTS.clinicalHistory.consents, params);
      })
    );
  }

  signConsent(consentId: number, patientSignature: string): Observable<InformedConsentItem> {
    return this.apiClient.post<InformedConsentItem>(
      API_ENDPOINTS.clinicalHistory.consentSign(consentId),
      {
        patient_signature: patientSignature
      }
    );
  }

  rejectConsent(consentId: number, reason?: string): Observable<InformedConsentItem> {
    return this.apiClient.post<InformedConsentItem>(
      API_ENDPOINTS.clinicalHistory.consentReject(consentId),
      {
        reason: reason ?? null
      }
    );
  }

  getSpecialtiesCatalog(): Observable<SpecialtyCatalogItem[]> {
    return this.apiClient.get<SpecialtyCatalogItem[]>(API_ENDPOINTS.specialties.catalog);
  }

  getMySpecialtyOverview(specialtyKey?: string): Observable<PatientSpecialtyOverview> {
    return this.apiClient.get<PatientSpecialtyOverview>(API_ENDPOINTS.specialties.myModuleOverview, {
      specialty_key: specialtyKey
    });
  }

  getMySpecialtyHistory(specialtyKey?: string): Observable<PatientSpecialtyHistory> {
    return this.apiClient.get<PatientSpecialtyHistory>(API_ENDPOINTS.specialties.history, {
      specialty_key: specialtyKey
    });
  }

  private resolvePatientId(): Observable<number> {
    const patientId = this.getCurrentPatientId();
    if (!patientId) {
      return throwError(() => new Error('No patient session found'));
    }
    return of(patientId);
  }
}
