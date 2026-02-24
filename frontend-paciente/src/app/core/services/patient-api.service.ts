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
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  appointment_type?: string | null;
  reason?: string | null;
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
  total_paid?: number;
  payments_count?: number;
  valid_until?: string | null;
  created_at: string;
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

  getMyBudgets(): Observable<PatientBudget[]> {
    return this.resolvePatientId().pipe(
      switchMap((patientId) =>
        this.apiClient.get<PatientBudget[]>(API_ENDPOINTS.patients.budgets(patientId))
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

  private resolvePatientId(): Observable<number> {
    const patientId = this.getCurrentPatientId();
    if (!patientId) {
      return throwError(() => new Error('No patient session found'));
    }
    return of(patientId);
  }
}
