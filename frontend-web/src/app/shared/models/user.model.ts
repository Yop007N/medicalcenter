export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "professional" | "patient";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Professional extends User {
  license_number: string;
  specialty: string;
  phone: string;
  address: string;
}

export interface Patient extends User {
  date_of_birth: string;
  phone: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  blood_type: string;
  allergies: string;
  medical_history: string;
  age?: number;
}
