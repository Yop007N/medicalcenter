import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiClientService } from './api-client.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { PatientProfile, PatientMedicalRecord, PatientOdontogram, PatientOdontogramTooth } from '../models/patient.model';
import { PatientAppointment, CreatePatientAppointmentPayload, ProfessionalDirectoryItem, ProfessionalAvailabilityItem } from '../models/appointment.model';
import { PatientBudget } from '../models/budget.model';
import { SpecialtyCatalogItem, PatientSpecialtyOverview, PatientSpecialtyHistory } from '../models/specialty.model';
import { ClinicalCounts, ClinicalHistoryEvent, ClinicalSummary, PatientDocumentItem, InformedConsentItem } from '../models/clinical.model';

// Re-export all models for backward compatibility
export { PatientProfile, PatientMedicalRecord, PatientOdontogram, PatientOdontogramTooth } from '../models/patient.model';
export { PatientAppointment, CreatePatientAppointmentPayload, ProfessionalDirectoryItem, ProfessionalAvailabilityItem } from '../models/appointment.model';
export { PatientBudget } from '../models/budget.model';
export { SpecialtyCatalogItem, PatientSpecialtyOverview, PatientSpecialtyHistory } from '../models/specialty.model';
export { ClinicalCounts, ClinicalHistoryEvent, ClinicalSummary, PatientDocumentItem, InformedConsentItem } from '../models/clinical.model';

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
