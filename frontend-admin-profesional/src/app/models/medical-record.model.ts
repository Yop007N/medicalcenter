export interface MedicalRecord {
  id: number;
  patient_id: number;
  professional_id: number;
  appointment_id?: number;
  record_date: string;
  chief_complaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: string;
  notes?: string;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  files?: MedicalFile[];
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
    specialty: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface MedicalRecordCreate {
  patient_id: number;
  professional_id?: number;
  appointment_id?: number;
  chief_complaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: string;
  notes?: string;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
}

export interface MedicalFile {
  id: number;
  medical_record_id: number;
  filename: string;
  file_type?: string;
  mime_type?: string;
  file_size?: number;
  storage_type?: string;
  file_path?: string;
  thumbnail_path?: string;
  description?: string;
  uploaded_by?: number;
  created_at: string;
}

export interface FileUpload {
  file: File;
  medical_record_id: number;
  file_type?: string;
  description?: string;
}
