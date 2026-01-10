// Appointment statuses
export const APPOINTMENT_SCHEDULED = 'scheduled';
export const APPOINTMENT_CONFIRMED = 'confirmed';
export const APPOINTMENT_COMPLETED = 'completed';
export const APPOINTMENT_CANCELLED = 'cancelled';
export const APPOINTMENT_NO_SHOW = 'no_show';

export const APPOINTMENT_STATUSES = [
  APPOINTMENT_SCHEDULED,
  APPOINTMENT_CONFIRMED,
  APPOINTMENT_COMPLETED,
  APPOINTMENT_CANCELLED,
  APPOINTMENT_NO_SHOW
] as const;
