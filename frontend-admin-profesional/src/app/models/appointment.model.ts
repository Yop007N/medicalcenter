export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: number;
  patient_id: number;
  professional_id: number;
  appointment_date: string;
  duration_minutes: number;
  appointment_type: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    specialty: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface AppointmentCreate {
  patient_id: number;
  professional_id: number;
  appointment_date: string;
  duration_minutes: number;
  appointment_type: string;
  reason?: string;
  notes?: string;
}

export interface CalendarParams {
  professional_id: number;
  date_from: string;
  date_to: string;
}
