export interface MedicalRecord {
  id: number;
  patient_id: number;
  professional_id: number;
  appointment_id?: number;
  record_date: string;
  chief_complaint: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescriptions: string;
  notes: string;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  created_at: string;
  updated_at: string;
  files?: MedicalFile[];
}

export interface MedicalFile {
  id: number;
  medical_record_id: number;
  filename: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  storage_type: 'cloud' | 'local';
  file_path: string;
  thumbnail_path?: string;
  description: string;
  created_at: string;
}
