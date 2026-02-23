import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppointmentsState } from './appointments.reducer';

export const selectAppointmentsState = createFeatureSelector<AppointmentsState>('appointments');

export const selectAllAppointments = createSelector(
  selectAppointmentsState,
  (state) => state.appointments
);

export const selectFilteredAppointments = createSelector(
  selectAppointmentsState,
  (state) => {
    let filtered = state.appointments;

    if (state.filters.status) {
      filtered = filtered.filter(a => a.status === state.filters.status);
    }

    if (state.filters.startDate) {
      const start = new Date(state.filters.startDate);
      filtered = filtered.filter(a => new Date(a.appointment_date) >= start);
    }

    if (state.filters.endDate) {
      const end = new Date(state.filters.endDate);
      filtered = filtered.filter(a => new Date(a.appointment_date) <= end);
    }

    return filtered;
  }
);

export const selectSelectedAppointment = createSelector(
  selectAppointmentsState,
  (state) => state.selectedAppointment
);

export const selectAppointmentsLoading = createSelector(
  selectAppointmentsState,
  (state) => state.loading
);

export const selectAppointmentsError = createSelector(
  selectAppointmentsState,
  (state) => state.error
);

export const selectFilters = createSelector(
  selectAppointmentsState,
  (state) => state.filters
);

export const selectAppointmentById = (id: number) => createSelector(
  selectAllAppointments,
  (appointments) => appointments.find(a => a.id === id)
);

export const selectUpcomingAppointments = createSelector(
  selectAllAppointments,
  (appointments) => {
    const now = new Date();
    return appointments
      .filter(a => new Date(a.appointment_date) >= now && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
  }
);

export const selectTodayAppointments = createSelector(
  selectAllAppointments,
  (appointments) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter(a => {
      const date = new Date(a.appointment_date);
      return date >= today && date < tomorrow;
    });
  }
);

export const selectPendingAppointments = createSelector(
  selectAllAppointments,
  (appointments) => appointments.filter(a => a.status === 'pending')
);

export const selectAppointmentsCount = createSelector(
  selectAllAppointments,
  (appointments) => appointments.length
);
