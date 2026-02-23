import { createReducer, on } from '@ngrx/store';
import { Appointment } from '../../models';
import * as AppointmentsActions from './appointments.actions';

export interface AppointmentsState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
  filters: {
    startDate: string | null;
    endDate: string | null;
    status: string | null;
  };
}

export const initialState: AppointmentsState = {
  appointments: [],
  selectedAppointment: null,
  loading: false,
  error: null,
  filters: {
    startDate: null,
    endDate: null,
    status: null
  }
};

export const appointmentsReducer = createReducer(
  initialState,

  // Load Appointments
  on(AppointmentsActions.loadAppointments, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AppointmentsActions.loadAppointmentsSuccess, (state, { appointments }) => ({
    ...state,
    appointments,
    loading: false
  })),
  on(AppointmentsActions.loadAppointmentsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Appointment
  on(AppointmentsActions.loadAppointment, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AppointmentsActions.loadAppointmentSuccess, (state, { appointment }) => ({
    ...state,
    selectedAppointment: appointment,
    loading: false
  })),
  on(AppointmentsActions.loadAppointmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Appointment
  on(AppointmentsActions.createAppointment, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AppointmentsActions.createAppointmentSuccess, (state, { appointment }) => ({
    ...state,
    appointments: [...state.appointments, appointment],
    loading: false
  })),
  on(AppointmentsActions.createAppointmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Appointment
  on(AppointmentsActions.updateAppointment, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AppointmentsActions.updateAppointmentSuccess, (state, { appointment }) => ({
    ...state,
    appointments: state.appointments.map(a => a.id === appointment.id ? appointment : a),
    selectedAppointment: appointment,
    loading: false
  })),
  on(AppointmentsActions.updateAppointmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Appointment
  on(AppointmentsActions.deleteAppointment, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AppointmentsActions.deleteAppointmentSuccess, (state, { id }) => ({
    ...state,
    appointments: state.appointments.filter(a => a.id !== id),
    loading: false
  })),
  on(AppointmentsActions.deleteAppointmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Confirm Appointment
  on(AppointmentsActions.confirmAppointment, (state) => ({
    ...state,
    loading: true
  })),
  on(AppointmentsActions.confirmAppointmentSuccess, (state, { appointment }) => ({
    ...state,
    appointments: state.appointments.map(a => a.id === appointment.id ? appointment : a),
    selectedAppointment: state.selectedAppointment?.id === appointment.id ? appointment : state.selectedAppointment,
    loading: false
  })),
  on(AppointmentsActions.confirmAppointmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Cancel Appointment
  on(AppointmentsActions.cancelAppointment, (state) => ({
    ...state,
    loading: true
  })),
  on(AppointmentsActions.cancelAppointmentSuccess, (state, { appointment }) => ({
    ...state,
    appointments: state.appointments.map(a => a.id === appointment.id ? appointment : a),
    selectedAppointment: state.selectedAppointment?.id === appointment.id ? appointment : state.selectedAppointment,
    loading: false
  })),
  on(AppointmentsActions.cancelAppointmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Complete Appointment
  on(AppointmentsActions.completeAppointment, (state) => ({
    ...state,
    loading: true
  })),
  on(AppointmentsActions.completeAppointmentSuccess, (state, { appointment }) => ({
    ...state,
    appointments: state.appointments.map(a => a.id === appointment.id ? appointment : a),
    selectedAppointment: state.selectedAppointment?.id === appointment.id ? appointment : state.selectedAppointment,
    loading: false
  })),
  on(AppointmentsActions.completeAppointmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Filters
  on(AppointmentsActions.setDateFilter, (state, { startDate, endDate }) => ({
    ...state,
    filters: { ...state.filters, startDate, endDate }
  })),
  on(AppointmentsActions.setStatusFilter, (state, { status }) => ({
    ...state,
    filters: { ...state.filters, status }
  })),
  on(AppointmentsActions.clearFilters, (state) => ({
    ...state,
    filters: { startDate: null, endDate: null, status: null }
  })),

  // Clear
  on(AppointmentsActions.clearSelectedAppointment, (state) => ({
    ...state,
    selectedAppointment: null
  })),
  on(AppointmentsActions.clearError, (state) => ({
    ...state,
    error: null
  }))
);
