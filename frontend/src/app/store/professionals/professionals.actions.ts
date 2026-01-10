import { createAction, props } from '@ngrx/store';
import { Professional } from '../../models';

// Load Professionals
export const loadProfessionals = createAction('[Professionals] Load Professionals');
export const loadProfessionalsSuccess = createAction(
  '[Professionals] Load Professionals Success',
  props<{ professionals: Professional[] }>()
);
export const loadProfessionalsFailure = createAction(
  '[Professionals] Load Professionals Failure',
  props<{ error: string }>()
);

// Load Single Professional
export const loadProfessional = createAction(
  '[Professionals] Load Professional',
  props<{ id: number }>()
);
export const loadProfessionalSuccess = createAction(
  '[Professionals] Load Professional Success',
  props<{ professional: Professional }>()
);
export const loadProfessionalFailure = createAction(
  '[Professionals] Load Professional Failure',
  props<{ error: string }>()
);

// Create Professional
export const createProfessional = createAction(
  '[Professionals] Create Professional',
  props<{ professional: Partial<Professional> }>()
);
export const createProfessionalSuccess = createAction(
  '[Professionals] Create Professional Success',
  props<{ professional: Professional }>()
);
export const createProfessionalFailure = createAction(
  '[Professionals] Create Professional Failure',
  props<{ error: string }>()
);

// Update Professional
export const updateProfessional = createAction(
  '[Professionals] Update Professional',
  props<{ id: number; professional: Partial<Professional> }>()
);
export const updateProfessionalSuccess = createAction(
  '[Professionals] Update Professional Success',
  props<{ professional: Professional }>()
);
export const updateProfessionalFailure = createAction(
  '[Professionals] Update Professional Failure',
  props<{ error: string }>()
);

// Delete Professional
export const deleteProfessional = createAction(
  '[Professionals] Delete Professional',
  props<{ id: number }>()
);
export const deleteProfessionalSuccess = createAction(
  '[Professionals] Delete Professional Success',
  props<{ id: number }>()
);
export const deleteProfessionalFailure = createAction(
  '[Professionals] Delete Professional Failure',
  props<{ error: string }>()
);

// Filter by Specialty
export const filterBySpecialty = createAction(
  '[Professionals] Filter By Specialty',
  props<{ specialty: string }>()
);

// Clear Selected
export const clearSelectedProfessional = createAction('[Professionals] Clear Selected');
export const clearError = createAction('[Professionals] Clear Error');
