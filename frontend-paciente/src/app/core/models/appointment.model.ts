export interface PatientAppointment {
  id: number;
  appointment_date: string;
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  appointment_type?: string | null;
  reason?: string | null;
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
    specialty?: string | null;
  };
}

export interface CreatePatientAppointmentPayload {
  professional_id: number;
  appointment_date: string;
  appointment_type?: string | null;
  reason?: string | null;
  duration_minutes?: number;
}

export interface ProfessionalDirectoryItem {
  id: number;
  first_name: string;
  last_name: string;
  specialty?: string | null;
  email?: string;
}

export interface ProfessionalAvailabilityItem extends ProfessionalDirectoryItem {
  next_available_slot: string;
  available_slots: string[];
  available_count: number;
}
