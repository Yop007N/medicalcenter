export interface User {
  id: number;
  email: string;
  role: 'admin' | 'professional' | 'patient';
  specialty?: string | null;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'professional' | 'patient';
  license_number?: string;
  specialty?: string;
}
