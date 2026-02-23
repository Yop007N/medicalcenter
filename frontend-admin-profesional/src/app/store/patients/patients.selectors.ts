import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PatientsState } from './patients.reducer';

export const selectPatientsState = createFeatureSelector<PatientsState>('patients');

export const selectAllPatients = createSelector(
  selectPatientsState,
  (state) => state.patients
);

export const selectFilteredPatients = createSelector(
  selectPatientsState,
  (state) => {
    if (!state.searchTerm) {
      return state.patients;
    }
    const term = state.searchTerm.toLowerCase();
    return state.patients.filter(p =>
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      (p.phone && p.phone.includes(term)) ||
      (p.document_number && p.document_number.includes(term))
    );
  }
);

export const selectSelectedPatient = createSelector(
  selectPatientsState,
  (state) => state.selectedPatient
);

export const selectPatientsLoading = createSelector(
  selectPatientsState,
  (state) => state.loading
);

export const selectPatientsError = createSelector(
  selectPatientsState,
  (state) => state.error
);

export const selectSearchTerm = createSelector(
  selectPatientsState,
  (state) => state.searchTerm
);

export const selectPatientById = (id: number) => createSelector(
  selectAllPatients,
  (patients) => patients.find(p => p.id === id)
);

export const selectActivePatients = createSelector(
  selectAllPatients,
  (patients) => patients.filter(p => p.is_active)
);

export const selectPatientsCount = createSelector(
  selectAllPatients,
  (patients) => patients.length
);
