export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}
