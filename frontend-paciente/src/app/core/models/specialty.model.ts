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
