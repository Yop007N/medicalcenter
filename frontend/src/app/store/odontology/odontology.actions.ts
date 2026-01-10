import { createAction, props } from '@ngrx/store';
import { Odontogram, Tooth, DentalTreatment, OdontogramCreate, ToothUpdate, DentalTreatmentCreate, DentalTreatmentUpdate } from '../../models/odontology.model';

// Load Odontograms by Patient
export const loadOdontograms = createAction(
  '[Odontology] Load Odontograms',
  props<{ patientId: number }>()
);
export const loadOdontogramsSuccess = createAction(
  '[Odontology] Load Odontograms Success',
  props<{ odontograms: Odontogram[] }>()
);
export const loadOdontogramsFailure = createAction(
  '[Odontology] Load Odontograms Failure',
  props<{ error: string }>()
);

// Load Single Odontogram
export const loadOdontogram = createAction(
  '[Odontology] Load Odontogram',
  props<{ id: number }>()
);
export const loadOdontogramSuccess = createAction(
  '[Odontology] Load Odontogram Success',
  props<{ odontogram: Odontogram }>()
);
export const loadOdontogramFailure = createAction(
  '[Odontology] Load Odontogram Failure',
  props<{ error: string }>()
);

// Create Odontogram
export const createOdontogram = createAction(
  '[Odontology] Create Odontogram',
  props<{ odontogram: OdontogramCreate }>()
);
export const createOdontogramSuccess = createAction(
  '[Odontology] Create Odontogram Success',
  props<{ odontogram: Odontogram }>()
);
export const createOdontogramFailure = createAction(
  '[Odontology] Create Odontogram Failure',
  props<{ error: string }>()
);

// Update Tooth
export const updateTooth = createAction(
  '[Odontology] Update Tooth',
  props<{ odontogramId: number; toothNumber: number; tooth: ToothUpdate }>()
);
export const updateToothSuccess = createAction(
  '[Odontology] Update Tooth Success',
  props<{ tooth: Tooth }>()
);
export const updateToothFailure = createAction(
  '[Odontology] Update Tooth Failure',
  props<{ error: string }>()
);

// Load Dental Treatments
export const loadDentalTreatments = createAction(
  '[Odontology] Load Dental Treatments',
  props<{ patientId?: number }>()
);
export const loadDentalTreatmentsSuccess = createAction(
  '[Odontology] Load Dental Treatments Success',
  props<{ treatments: DentalTreatment[] }>()
);
export const loadDentalTreatmentsFailure = createAction(
  '[Odontology] Load Dental Treatments Failure',
  props<{ error: string }>()
);

// Load Single Treatment
export const loadDentalTreatment = createAction(
  '[Odontology] Load Dental Treatment',
  props<{ id: number }>()
);
export const loadDentalTreatmentSuccess = createAction(
  '[Odontology] Load Dental Treatment Success',
  props<{ treatment: DentalTreatment }>()
);
export const loadDentalTreatmentFailure = createAction(
  '[Odontology] Load Dental Treatment Failure',
  props<{ error: string }>()
);

// Create Treatment
export const createDentalTreatment = createAction(
  '[Odontology] Create Dental Treatment',
  props<{ treatment: DentalTreatmentCreate }>()
);
export const createDentalTreatmentSuccess = createAction(
  '[Odontology] Create Dental Treatment Success',
  props<{ treatment: DentalTreatment }>()
);
export const createDentalTreatmentFailure = createAction(
  '[Odontology] Create Dental Treatment Failure',
  props<{ error: string }>()
);

// Update Treatment
export const updateDentalTreatment = createAction(
  '[Odontology] Update Dental Treatment',
  props<{ id: number; treatment: DentalTreatmentUpdate }>()
);
export const updateDentalTreatmentSuccess = createAction(
  '[Odontology] Update Dental Treatment Success',
  props<{ treatment: DentalTreatment }>()
);
export const updateDentalTreatmentFailure = createAction(
  '[Odontology] Update Dental Treatment Failure',
  props<{ error: string }>()
);

// Delete Treatment
export const deleteDentalTreatment = createAction(
  '[Odontology] Delete Dental Treatment',
  props<{ id: number }>()
);
export const deleteDentalTreatmentSuccess = createAction(
  '[Odontology] Delete Dental Treatment Success',
  props<{ id: number }>()
);
export const deleteDentalTreatmentFailure = createAction(
  '[Odontology] Delete Dental Treatment Failure',
  props<{ error: string }>()
);

// Clear
export const clearOdontologyState = createAction('[Odontology] Clear State');
export const clearError = createAction('[Odontology] Clear Error');
