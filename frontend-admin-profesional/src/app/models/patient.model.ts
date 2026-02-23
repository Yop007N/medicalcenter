export interface Patient {
  id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  document_type?: string;
  document_number?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  notes?: string;
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  is_active: boolean;
  age?: number;
  created_at: string;
  updated_at?: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  document_type?: string;
  document_number?: string;
  blood_type?: string;
  allergies?: string;
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
}
