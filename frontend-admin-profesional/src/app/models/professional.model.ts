export interface Professional {
  id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialty: string;
  license_number?: string;
  bio?: string;
  consultation_fee?: number;
  office_address?: string;
  working_hours?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProfessionalCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialty: string;
  license_number?: string;
  bio?: string;
  consultation_fee?: number;
  office_address?: string;
  working_hours?: string;
}
