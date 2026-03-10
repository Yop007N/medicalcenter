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
