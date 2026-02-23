import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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

@Injectable({ providedIn: 'root' })
export class ClinicalHistoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/clinical-history`;

  // ==================== EVOLUTIONS ====================

  getEvolutions(patientId: number, includeAnnulled = false): Observable<Evolution[]> {
    let params = new HttpParams().set('patient_id', patientId.toString());
    if (includeAnnulled) {
      params = params.set('include_annulled', 'true');
    }
    return this.http.get<Evolution[]>(`${this.baseUrl}/evolutions`, { params });
  }

  getEvolution(evolutionId: number): Observable<Evolution> {
    return this.http.get<Evolution>(`${this.baseUrl}/evolutions/${evolutionId}`);
  }

  createEvolution(data: Partial<Evolution>): Observable<Evolution> {
    return this.http.post<Evolution>(`${this.baseUrl}/evolutions`, data);
  }

  updateEvolution(evolutionId: number, data: Partial<Evolution>): Observable<Evolution> {
    return this.http.put<Evolution>(`${this.baseUrl}/evolutions/${evolutionId}`, data);
  }

  signEvolution(evolutionId: number, signerType: 'professional' | 'patient', signature: string): Observable<Evolution> {
    return this.http.post<Evolution>(`${this.baseUrl}/evolutions/${evolutionId}/sign`, {
      signer_type: signerType,
      signature
    });
  }

  annulEvolution(evolutionId: number): Observable<Evolution> {
    return this.http.post<Evolution>(`${this.baseUrl}/evolutions/${evolutionId}/annul`, {});
  }

  // ==================== ANAMNESIS ====================

  getAnamnesis(patientId: number): Observable<Anamnesis> {
    return this.http.get<Anamnesis>(`${this.baseUrl}/anamnesis/patient/${patientId}`);
  }

  saveAnamnesis(data: Partial<Anamnesis>): Observable<Anamnesis> {
    return this.http.post<Anamnesis>(`${this.baseUrl}/anamnesis`, data);
  }

  // ==================== PERIODONTAL RECORDS ====================

  getPeriodontalRecords(patientId: number, measurementDate?: string): Observable<PeriodontalRecord[]> {
    let params = new HttpParams().set('patient_id', patientId.toString());
    if (measurementDate) {
      params = params.set('measurement_date', measurementDate);
    }
    return this.http.get<PeriodontalRecord[]>(`${this.baseUrl}/periodontal`, { params });
  }

  savePeriodontalRecord(data: Partial<PeriodontalRecord>): Observable<PeriodontalRecord> {
    return this.http.post<PeriodontalRecord>(`${this.baseUrl}/periodontal`, data);
  }

  bulkSavePeriodontalRecords(patientId: number, records: Partial<PeriodontalRecord>[], measurementDate?: string): Observable<PeriodontalRecord[]> {
    return this.http.post<PeriodontalRecord[]>(`${this.baseUrl}/periodontal/bulk`, {
      patient_id: patientId,
      records,
      measurement_date: measurementDate
    });
  }

  // ==================== PATIENT DOCUMENTS ====================

  getDocuments(patientId: number, documentType?: string, includeInactive = false): Observable<PatientDocument[]> {
    let params = new HttpParams().set('patient_id', patientId.toString());
    if (documentType) {
      params = params.set('document_type', documentType);
    }
    if (includeInactive) {
      params = params.set('include_inactive', 'true');
    }
    return this.http.get<PatientDocument[]>(`${this.baseUrl}/documents`, { params });
  }

  createDocument(data: Partial<PatientDocument>): Observable<PatientDocument> {
    return this.http.post<PatientDocument>(`${this.baseUrl}/documents`, data);
  }

  /**
   * Upload a document file using FormData
   */
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

    return this.http.post<PatientDocument>(`${this.baseUrl}/documents/upload`, formData);
  }

  /**
   * Download a document file
   */
  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
  }

  deleteDocument(documentId: number): Observable<{ msg: string }> {
    return this.http.delete<{ msg: string }>(`${this.baseUrl}/documents/${documentId}`);
  }

  // ==================== PRESCRIPTIONS ====================

  getPrescriptions(patientId: number, treatmentId?: number, includeAnnulled = false): Observable<Prescription[]> {
    let params = new HttpParams().set('patient_id', patientId.toString());
    if (treatmentId) {
      params = params.set('treatment_id', treatmentId.toString());
    }
    if (includeAnnulled) {
      params = params.set('include_annulled', 'true');
    }
    return this.http.get<Prescription[]>(`${this.baseUrl}/prescriptions`, { params });
  }

  createPrescription(data: Partial<Prescription>): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.baseUrl}/prescriptions`, data);
  }

  annulPrescription(prescriptionId: number): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.baseUrl}/prescriptions/${prescriptionId}/annul`, {});
  }

  // ==================== CLINICAL DOCUMENTS ====================

  getClinicalDocuments(patientId: number, documentType?: string, includeInactive = false): Observable<ClinicalDocument[]> {
    let params = new HttpParams().set('patient_id', patientId.toString());
    if (documentType) {
      params = params.set('document_type', documentType);
    }
    if (includeInactive) {
      params = params.set('include_inactive', 'true');
    }
    return this.http.get<ClinicalDocument[]>(`${this.baseUrl}/clinical-docs`, { params });
  }

  createClinicalDocument(data: Partial<ClinicalDocument>): Observable<ClinicalDocument> {
    return this.http.post<ClinicalDocument>(`${this.baseUrl}/clinical-docs`, data);
  }

  deleteClinicalDocument(documentId: number): Observable<{ msg: string }> {
    return this.http.delete<{ msg: string }>(`${this.baseUrl}/clinical-docs/${documentId}`);
  }

  // ==================== INFORMED CONSENTS ====================

  getConsents(patientId: number, status?: string): Observable<InformedConsent[]> {
    let params = new HttpParams().set('patient_id', patientId.toString());
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<InformedConsent[]>(`${this.baseUrl}/consents`, { params });
  }

  createConsent(data: Partial<InformedConsent>): Observable<InformedConsent> {
    return this.http.post<InformedConsent>(`${this.baseUrl}/consents`, data);
  }

  signConsent(consentId: number, patientSignature: string, guardianData?: {
    guardian_name?: string;
    guardian_relationship?: string;
    guardian_signature?: string;
  }): Observable<InformedConsent> {
    return this.http.post<InformedConsent>(`${this.baseUrl}/consents/${consentId}/sign`, {
      patient_signature: patientSignature,
      ...guardianData
    });
  }

  rejectConsent(consentId: number, reason?: string): Observable<InformedConsent> {
    return this.http.post<InformedConsent>(`${this.baseUrl}/consents/${consentId}/reject`, { reason });
  }

  // ==================== TIMELINE ====================

  getTimeline(patientId: number, eventType?: string, limit = 50): Observable<ClinicalHistoryEvent[]> {
    let params = new HttpParams()
      .set('patient_id', patientId.toString())
      .set('limit', limit.toString());
    if (eventType) {
      params = params.set('event_type', eventType);
    }
    return this.http.get<ClinicalHistoryEvent[]>(`${this.baseUrl}/timeline`, { params });
  }

  createTimelineEvent(data: {
    patient_id: number;
    event_type: 'note' | 'alert';
    title: string;
    description?: string;
    is_important?: boolean;
  }): Observable<ClinicalHistoryEvent> {
    return this.http.post<ClinicalHistoryEvent>(`${this.baseUrl}/timeline`, data);
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
    return this.http.get<any>(`${this.baseUrl}/summary/${patientId}`);
  }
}
