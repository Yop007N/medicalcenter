export interface Appointment {
  id: number;
  patient_id: number;
  professional_id: number;
  appointment_date: string;
  duration_minutes: number;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  appointment_type: string;
  reason: string;
  notes: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}
