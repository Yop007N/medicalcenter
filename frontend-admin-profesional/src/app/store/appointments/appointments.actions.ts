import { createAction, props } from '@ngrx/store';
import { Appointment } from '../../models';

// Load Appointments
export const loadAppointments = createAction('[Appointments] Load Appointments');
export const loadAppointmentsSuccess = createAction(
  '[Appointments] Load Appointments Success',
  props<{ appointments: Appointment[] }>()
);
export const loadAppointmentsFailure = createAction(
  '[Appointments] Load Appointments Failure',
  props<{ error: string }>()
);

// Load Single Appointment
export const loadAppointment = createAction(
  '[Appointments] Load Appointment',
  props<{ id: number }>()
);
export const loadAppointmentSuccess = createAction(
  '[Appointments] Load Appointment Success',
  props<{ appointment: Appointment }>()
);
export const loadAppointmentFailure = createAction(
  '[Appointments] Load Appointment Failure',
  props<{ error: string }>()
);

// Create Appointment
export const createAppointment = createAction(
  '[Appointments] Create Appointment',
  props<{ appointment: Partial<Appointment> }>()
);
export const createAppointmentSuccess = createAction(
  '[Appointments] Create Appointment Success',
  props<{ appointment: Appointment }>()
);
export const createAppointmentFailure = createAction(
  '[Appointments] Create Appointment Failure',
  props<{ error: string }>()
);

// Update Appointment
export const updateAppointment = createAction(
  '[Appointments] Update Appointment',
  props<{ id: number; appointment: Partial<Appointment> }>()
);
export const updateAppointmentSuccess = createAction(
  '[Appointments] Update Appointment Success',
  props<{ appointment: Appointment }>()
);
export const updateAppointmentFailure = createAction(
  '[Appointments] Update Appointment Failure',
  props<{ error: string }>()
);

// Delete Appointment
export const deleteAppointment = createAction(
  '[Appointments] Delete Appointment',
  props<{ id: number }>()
);
export const deleteAppointmentSuccess = createAction(
  '[Appointments] Delete Appointment Success',
  props<{ id: number }>()
);
export const deleteAppointmentFailure = createAction(
  '[Appointments] Delete Appointment Failure',
  props<{ error: string }>()
);

// Confirm Appointment
export const confirmAppointment = createAction(
  '[Appointments] Confirm Appointment',
  props<{ id: number }>()
);
export const confirmAppointmentSuccess = createAction(
  '[Appointments] Confirm Appointment Success',
  props<{ appointment: Appointment }>()
);
export const confirmAppointmentFailure = createAction(
  '[Appointments] Confirm Appointment Failure',
  props<{ error: string }>()
);

// Cancel Appointment
export const cancelAppointment = createAction(
  '[Appointments] Cancel Appointment',
  props<{ id: number; reason: string }>()
);
export const cancelAppointmentSuccess = createAction(
  '[Appointments] Cancel Appointment Success',
  props<{ appointment: Appointment }>()
);
export const cancelAppointmentFailure = createAction(
  '[Appointments] Cancel Appointment Failure',
  props<{ error: string }>()
);

// Complete Appointment
export const completeAppointment = createAction(
  '[Appointments] Complete Appointment',
  props<{ id: number }>()
);
export const completeAppointmentSuccess = createAction(
  '[Appointments] Complete Appointment Success',
  props<{ appointment: Appointment }>()
);
export const completeAppointmentFailure = createAction(
  '[Appointments] Complete Appointment Failure',
  props<{ error: string }>()
);

// Filter Actions
export const setDateFilter = createAction(
  '[Appointments] Set Date Filter',
  props<{ startDate: string; endDate: string }>()
);
export const setStatusFilter = createAction(
  '[Appointments] Set Status Filter',
  props<{ status: string }>()
);
export const clearFilters = createAction('[Appointments] Clear Filters');

// Clear
export const clearSelectedAppointment = createAction('[Appointments] Clear Selected');
export const clearError = createAction('[Appointments] Clear Error');
