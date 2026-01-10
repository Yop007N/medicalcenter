import { createReducer, on } from '@ngrx/store';
import { Odontogram, DentalTreatment } from '../../models/odontology.model';
import * as OdontologyActions from './odontology.actions';

export interface OdontologyState {
  odontograms: Odontogram[];
  selectedOdontogram: Odontogram | null;
  treatments: DentalTreatment[];
  selectedTreatment: DentalTreatment | null;
  loading: boolean;
  error: string | null;
}

export const initialState: OdontologyState = {
  odontograms: [],
  selectedOdontogram: null,
  treatments: [],
  selectedTreatment: null,
  loading: false,
  error: null
};

export const odontologyReducer = createReducer(
  initialState,

  // Load Odontograms
  on(OdontologyActions.loadOdontograms, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OdontologyActions.loadOdontogramsSuccess, (state, { odontograms }) => ({
    ...state,
    odontograms,
    loading: false
  })),
  on(OdontologyActions.loadOdontogramsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Odontogram
  on(OdontologyActions.loadOdontogram, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OdontologyActions.loadOdontogramSuccess, (state, { odontogram }) => ({
    ...state,
    selectedOdontogram: odontogram,
    loading: false
  })),
  on(OdontologyActions.loadOdontogramFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Odontogram
  on(OdontologyActions.createOdontogram, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OdontologyActions.createOdontogramSuccess, (state, { odontogram }) => ({
    ...state,
    odontograms: [...state.odontograms, odontogram],
    selectedOdontogram: odontogram,
    loading: false
  })),
  on(OdontologyActions.createOdontogramFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Tooth
  on(OdontologyActions.updateTooth, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OdontologyActions.updateToothSuccess, (state, { tooth }) => {
    if (!state.selectedOdontogram) return { ...state, loading: false };

    const updatedTeeth = state.selectedOdontogram.teeth?.map(t =>
      t.tooth_number === tooth.tooth_number ? tooth : t
    ) || [tooth];

    return {
      ...state,
      selectedOdontogram: {
        ...state.selectedOdontogram,
        teeth: updatedTeeth
      },
      loading: false
    };
  }),
  on(OdontologyActions.updateToothFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Treatments
  on(OdontologyActions.loadDentalTreatments, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OdontologyActions.loadDentalTreatmentsSuccess, (state, { treatments }) => ({
    ...state,
    treatments: Array.isArray(treatments) ? treatments : [],
    loading: false
  })),
  on(OdontologyActions.loadDentalTreatmentsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Treatment
  on(OdontologyActions.loadDentalTreatment, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OdontologyActions.loadDentalTreatmentSuccess, (state, { treatment }) => ({
    ...state,
    selectedTreatment: treatment,
    loading: false
  })),
  on(OdontologyActions.loadDentalTreatmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Treatment
  on(OdontologyActions.createDentalTreatment, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OdontologyActions.createDentalTreatmentSuccess, (state, { treatment }) => ({
    ...state,
    treatments: [...state.treatments, treatment],
    selectedTreatment: treatment,
    loading: false
  })),
  on(OdontologyActions.createDentalTreatmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Treatment
  on(OdontologyActions.updateDentalTreatment, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OdontologyActions.updateDentalTreatmentSuccess, (state, { treatment }) => ({
    ...state,
    treatments: state.treatments.map(t => t.id === treatment.id ? treatment : t),
    selectedTreatment: treatment,
    loading: false
  })),
  on(OdontologyActions.updateDentalTreatmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Treatment
  on(OdontologyActions.deleteDentalTreatment, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OdontologyActions.deleteDentalTreatmentSuccess, (state, { id }) => ({
    ...state,
    treatments: state.treatments.filter(t => t.id !== id),
    selectedTreatment: state.selectedTreatment?.id === id ? null : state.selectedTreatment,
    loading: false
  })),
  on(OdontologyActions.deleteDentalTreatmentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear
  on(OdontologyActions.clearOdontologyState, () => initialState),
  on(OdontologyActions.clearError, state => ({
    ...state,
    error: null
  }))
);
