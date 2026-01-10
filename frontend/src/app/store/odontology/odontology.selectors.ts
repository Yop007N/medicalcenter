import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OdontologyState } from './odontology.reducer';

export const selectOdontologyState = createFeatureSelector<OdontologyState>('odontology');

export const selectOdontograms = createSelector(
  selectOdontologyState,
  state => state.odontograms
);

export const selectSelectedOdontogram = createSelector(
  selectOdontologyState,
  state => state.selectedOdontogram
);

export const selectDentalTreatments = createSelector(
  selectOdontologyState,
  state => Array.isArray(state?.treatments) ? state.treatments : []
);

export const selectSelectedTreatment = createSelector(
  selectOdontologyState,
  state => state.selectedTreatment
);

export const selectOdontologyLoading = createSelector(
  selectOdontologyState,
  state => state.loading
);

export const selectOdontologyError = createSelector(
  selectOdontologyState,
  state => state.error
);

// Get active odontogram for a patient
export const selectActiveOdontogram = createSelector(
  selectOdontograms,
  odontograms => odontograms.find(o => o.is_active) || null
);

// Get teeth from selected odontogram
export const selectTeeth = createSelector(
  selectSelectedOdontogram,
  odontogram => odontogram?.teeth || []
);

// Get tooth by number
export const selectToothByNumber = (toothNumber: number) => createSelector(
  selectTeeth,
  teeth => teeth.find(t => t.tooth_number === toothNumber) || null
);

// Get treatments by status
export const selectTreatmentsByStatus = (status: string) => createSelector(
  selectDentalTreatments,
  treatments => treatments.filter(t => t.status === status)
);

// Get pending treatments
export const selectPendingTreatments = createSelector(
  selectDentalTreatments,
  treatments => treatments.filter(t => t.status === 'planned' || t.status === 'in_progress')
);
