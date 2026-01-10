import { createReducer, on } from '@ngrx/store';
import { Patient } from '../../models';
import * as PatientsActions from './patients.actions';

export interface PatientsState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
}

export const initialState: PatientsState = {
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,
  searchTerm: ''
};

export const patientsReducer = createReducer(
  initialState,

  // Load Patients
  on(PatientsActions.loadPatients, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PatientsActions.loadPatientsSuccess, (state, { patients }) => ({
    ...state,
    patients,
    loading: false
  })),
  on(PatientsActions.loadPatientsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Patient
  on(PatientsActions.loadPatient, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PatientsActions.loadPatientSuccess, (state, { patient }) => ({
    ...state,
    selectedPatient: patient,
    loading: false
  })),
  on(PatientsActions.loadPatientFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Patient
  on(PatientsActions.createPatient, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PatientsActions.createPatientSuccess, (state, { patient }) => ({
    ...state,
    patients: [...state.patients, patient],
    loading: false
  })),
  on(PatientsActions.createPatientFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Patient
  on(PatientsActions.updatePatient, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PatientsActions.updatePatientSuccess, (state, { patient }) => ({
    ...state,
    patients: state.patients.map(p => p.id === patient.id ? patient : p),
    selectedPatient: patient,
    loading: false
  })),
  on(PatientsActions.updatePatientFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Patient
  on(PatientsActions.deletePatient, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PatientsActions.deletePatientSuccess, (state, { id }) => ({
    ...state,
    patients: state.patients.filter(p => p.id !== id),
    loading: false
  })),
  on(PatientsActions.deletePatientFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Search
  on(PatientsActions.searchPatients, (state, { term }) => ({
    ...state,
    searchTerm: term
  })),

  // Clear Selected
  on(PatientsActions.clearSelectedPatient, (state) => ({
    ...state,
    selectedPatient: null
  })),

  // Clear Error
  on(PatientsActions.clearError, (state) => ({
    ...state,
    error: null
  }))
);
