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
