import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Evolution,
  Anamnesis,
  PeriodontalRecord,
  PatientDocument,
  Prescription,
  ClinicalDocument,
  InformedConsent,
  ClinicalHistoryEvent
} from '../../models/odontology.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class ClinicalHistoryService {
  private apiClient = inject(ApiClientService);

  // ==================== EVOLUTIONS ====================

  getEvolutions(patientId: number, includeAnnulled = false): Observable<Evolution[]> {
    return this.apiClient.get<Evolution[]>(API_ENDPOINTS.clinicalHistory.evolutions, {
      patient_id: patientId,
      include_annulled: includeAnnulled ? true : undefined
    });
  }

  getEvolution(evolutionId: number): Observable<Evolution> {
    return this.apiClient.get<Evolution>(API_ENDPOINTS.clinicalHistory.evolutionById(evolutionId));
  }

  createEvolution(data: Partial<Evolution>): Observable<Evolution> {
    return this.apiClient.post<Evolution>(API_ENDPOINTS.clinicalHistory.evolutions, data);
  }

  updateEvolution(evolutionId: number, data: Partial<Evolution>): Observable<Evolution> {
    return this.apiClient.put<Evolution>(API_ENDPOINTS.clinicalHistory.evolutionById(evolutionId), data);
  }

  signEvolution(evolutionId: number, signerType: 'professional' | 'patient', signature: string): Observable<Evolution> {
    return this.apiClient.post<Evolution>(API_ENDPOINTS.clinicalHistory.evolutionSign(evolutionId), {
      signer_type: signerType,
      signature
    });
  }

  annulEvolution(evolutionId: number): Observable<Evolution> {
    return this.apiClient.post<Evolution>(API_ENDPOINTS.clinicalHistory.evolutionAnnul(evolutionId), {});
  }

  // ==================== ANAMNESIS ====================

  getAnamnesis(patientId: number): Observable<Anamnesis> {
    return this.apiClient.get<Anamnesis>(API_ENDPOINTS.clinicalHistory.anamnesisByPatient(patientId));
  }

  saveAnamnesis(data: Partial<Anamnesis>): Observable<Anamnesis> {
    return this.apiClient.post<Anamnesis>(API_ENDPOINTS.clinicalHistory.anamnesis, data);
  }

  // ==================== PERIODONTAL RECORDS ====================

  getPeriodontalRecords(patientId: number, measurementDate?: string): Observable<PeriodontalRecord[]> {
    return this.apiClient.get<PeriodontalRecord[]>(API_ENDPOINTS.clinicalHistory.periodontal, {
      patient_id: patientId,
      measurement_date: measurementDate
    });
  }

  savePeriodontalRecord(data: Partial<PeriodontalRecord>): Observable<PeriodontalRecord> {
    return this.apiClient.post<PeriodontalRecord>(API_ENDPOINTS.clinicalHistory.periodontal, data);
  }

  bulkSavePeriodontalRecords(
    patientId: number,
    records: Partial<PeriodontalRecord>[],
    measurementDate?: string
  ): Observable<PeriodontalRecord[]> {
    return this.apiClient.post<PeriodontalRecord[]>(API_ENDPOINTS.clinicalHistory.periodontalBulk, {
      patient_id: patientId,
      records,
      measurement_date: measurementDate
    });
  }

  // ==================== PATIENT DOCUMENTS ====================

  getDocuments(patientId: number, documentType?: string, includeInactive = false): Observable<PatientDocument[]> {
    return this.apiClient.get<PatientDocument[]>(API_ENDPOINTS.clinicalHistory.documents, {
      patient_id: patientId,
      document_type: documentType,
      include_inactive: includeInactive ? true : undefined
    });
  }

  createDocument(data: Partial<PatientDocument>): Observable<PatientDocument> {
    return this.apiClient.post<PatientDocument>(API_ENDPOINTS.clinicalHistory.documents, data);
  }

  uploadDocument(file: File, patientId: number, documentType: string, options?: {
    title?: string;
    description?: string;
    affectedTeeth?: number[];
  }): Observable<PatientDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId.toString());
    formData.append('document_type', documentType);

    if (options?.title) {
      formData.append('title', options.title);
    }
    if (options?.description) {
      formData.append('description', options.description);
    }
    if (options?.affectedTeeth) {
      formData.append('affected_teeth', JSON.stringify(options.affectedTeeth));
    }

    return this.apiClient.post<PatientDocument>(API_ENDPOINTS.clinicalHistory.documentUpload, formData);
  }

  downloadDocument(documentId: number): Observable<Blob> {
    return this.apiClient.getBlob(API_ENDPOINTS.clinicalHistory.documentDownload(documentId));
  }

  deleteDocument(documentId: number): Observable<{ msg: string }> {
    return this.apiClient.delete<{ msg: string }>(API_ENDPOINTS.clinicalHistory.documentById(documentId));
  }

  // ==================== PRESCRIPTIONS ====================

  getPrescriptions(patientId: number, treatmentId?: number, includeAnnulled = false): Observable<Prescription[]> {
    return this.apiClient.get<Prescription[]>(API_ENDPOINTS.clinicalHistory.prescriptions, {
      patient_id: patientId,
      treatment_id: treatmentId,
      include_annulled: includeAnnulled ? true : undefined
    });
  }

  createPrescription(data: Partial<Prescription>): Observable<Prescription> {
    return this.apiClient.post<Prescription>(API_ENDPOINTS.clinicalHistory.prescriptions, data);
  }

  annulPrescription(prescriptionId: number): Observable<Prescription> {
    return this.apiClient.post<Prescription>(API_ENDPOINTS.clinicalHistory.prescriptionAnnul(prescriptionId), {});
  }

  // ==================== CLINICAL DOCUMENTS ====================

  getClinicalDocuments(patientId: number, documentType?: string, includeInactive = false): Observable<ClinicalDocument[]> {
    return this.apiClient.get<ClinicalDocument[]>(API_ENDPOINTS.clinicalHistory.clinicalDocuments, {
      patient_id: patientId,
      document_type: documentType,
      include_inactive: includeInactive ? true : undefined
    });
  }

  createClinicalDocument(data: Partial<ClinicalDocument>): Observable<ClinicalDocument> {
    return this.apiClient.post<ClinicalDocument>(API_ENDPOINTS.clinicalHistory.clinicalDocuments, data);
  }

  deleteClinicalDocument(documentId: number): Observable<{ msg: string }> {
    return this.apiClient.delete<{ msg: string }>(API_ENDPOINTS.clinicalHistory.clinicalDocumentById(documentId));
  }

  // ==================== INFORMED CONSENTS ====================

  getConsents(patientId: number, status?: string): Observable<InformedConsent[]> {
    return this.apiClient.get<InformedConsent[]>(API_ENDPOINTS.clinicalHistory.consents, {
      patient_id: patientId,
      status
    });
  }

  createConsent(data: Partial<InformedConsent>): Observable<InformedConsent> {
    return this.apiClient.post<InformedConsent>(API_ENDPOINTS.clinicalHistory.consents, data);
  }

  signConsent(consentId: number, patientSignature: string, guardianData?: {
    guardian_name?: string;
    guardian_relationship?: string;
    guardian_signature?: string;
  }): Observable<InformedConsent> {
    return this.apiClient.post<InformedConsent>(API_ENDPOINTS.clinicalHistory.consentSign(consentId), {
      patient_signature: patientSignature,
      ...guardianData
    });
  }

  rejectConsent(consentId: number, reason?: string): Observable<InformedConsent> {
    return this.apiClient.post<InformedConsent>(API_ENDPOINTS.clinicalHistory.consentReject(consentId), {
      reason
    });
  }

  // ==================== TIMELINE ====================

  getTimeline(patientId: number, eventType?: string, limit = 50): Observable<ClinicalHistoryEvent[]> {
    return this.apiClient.get<ClinicalHistoryEvent[]>(API_ENDPOINTS.clinicalHistory.timeline, {
      patient_id: patientId,
      event_type: eventType,
      limit
    });
  }

  createTimelineEvent(data: {
    patient_id: number;
    event_type: 'note' | 'alert';
    title: string;
    description?: string;
    is_important?: boolean;
  }): Observable<ClinicalHistoryEvent> {
    return this.apiClient.post<ClinicalHistoryEvent>(API_ENDPOINTS.clinicalHistory.timeline, data);
  }

  // ==================== SUMMARY ====================

  getSummary(patientId: number): Observable<{
    patient_id: number;
    has_anamnesis: boolean;
    medical_alerts: string[];
    counts: {
      evolutions: number;
      prescriptions: number;
      documents: number;
      clinical_documents: number;
      consents_pending: number;
      consents_signed: number;
    };
    recent_events: ClinicalHistoryEvent[];
  }> {
    return this.apiClient.get(API_ENDPOINTS.clinicalHistory.summary(patientId));
  }
}
