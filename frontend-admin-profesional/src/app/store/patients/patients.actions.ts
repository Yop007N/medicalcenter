import { createAction, props } from '@ngrx/store';
import { Patient } from '../../models';

// Load Patients
export const loadPatients = createAction('[Patients] Load Patients');
export const loadPatientsSuccess = createAction(
  '[Patients] Load Patients Success',
  props<{ patients: Patient[] }>()
);
export const loadPatientsFailure = createAction(
  '[Patients] Load Patients Failure',
  props<{ error: string }>()
);

// Load Single Patient
export const loadPatient = createAction(
  '[Patients] Load Patient',
  props<{ id: number }>()
);
export const loadPatientSuccess = createAction(
  '[Patients] Load Patient Success',
  props<{ patient: Patient }>()
);
export const loadPatientFailure = createAction(
  '[Patients] Load Patient Failure',
  props<{ error: string }>()
);

// Create Patient
export const createPatient = createAction(
  '[Patients] Create Patient',
  props<{ patient: Partial<Patient> }>()
);
export const createPatientSuccess = createAction(
  '[Patients] Create Patient Success',
  props<{ patient: Patient }>()
);
export const createPatientFailure = createAction(
  '[Patients] Create Patient Failure',
  props<{ error: string }>()
);

// Update Patient
export const updatePatient = createAction(
  '[Patients] Update Patient',
  props<{ id: number; patient: Partial<Patient> }>()
);
export const updatePatientSuccess = createAction(
  '[Patients] Update Patient Success',
  props<{ patient: Patient }>()
);
export const updatePatientFailure = createAction(
  '[Patients] Update Patient Failure',
  props<{ error: string }>()
);

// Delete Patient
export const deletePatient = createAction(
  '[Patients] Delete Patient',
  props<{ id: number }>()
);
export const deletePatientSuccess = createAction(
  '[Patients] Delete Patient Success',
  props<{ id: number }>()
);
export const deletePatientFailure = createAction(
  '[Patients] Delete Patient Failure',
  props<{ error: string }>()
);

// Search Patients
export const searchPatients = createAction(
  '[Patients] Search Patients',
  props<{ term: string }>()
);

// Clear Selected
export const clearSelectedPatient = createAction('[Patients] Clear Selected Patient');

// Clear Error
export const clearError = createAction('[Patients] Clear Error');
