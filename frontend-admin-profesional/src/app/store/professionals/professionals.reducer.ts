import { createReducer, on } from '@ngrx/store';
import { Professional } from '../../models';
import * as ProfessionalsActions from './professionals.actions';

export interface ProfessionalsState {
  professionals: Professional[];
  selectedProfessional: Professional | null;
  loading: boolean;
  error: string | null;
  specialtyFilter: string;
}

export const initialState: ProfessionalsState = {
  professionals: [],
  selectedProfessional: null,
  loading: false,
  error: null,
  specialtyFilter: ''
};

export const professionalsReducer = createReducer(
  initialState,

  // Load Professionals
  on(ProfessionalsActions.loadProfessionals, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ProfessionalsActions.loadProfessionalsSuccess, (state, { professionals }) => ({
    ...state,
    professionals,
    loading: false
  })),
  on(ProfessionalsActions.loadProfessionalsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Professional
  on(ProfessionalsActions.loadProfessional, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ProfessionalsActions.loadProfessionalSuccess, (state, { professional }) => ({
    ...state,
    selectedProfessional: professional,
    loading: false
  })),
  on(ProfessionalsActions.loadProfessionalFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Professional
  on(ProfessionalsActions.createProfessional, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ProfessionalsActions.createProfessionalSuccess, (state, { professional }) => ({
    ...state,
    professionals: [...state.professionals, professional],
    loading: false
  })),
  on(ProfessionalsActions.createProfessionalFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Professional
  on(ProfessionalsActions.updateProfessional, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ProfessionalsActions.updateProfessionalSuccess, (state, { professional }) => ({
    ...state,
    professionals: state.professionals.map(p => p.id === professional.id ? professional : p),
    selectedProfessional: professional,
    loading: false
  })),
  on(ProfessionalsActions.updateProfessionalFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Professional
  on(ProfessionalsActions.deleteProfessional, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ProfessionalsActions.deleteProfessionalSuccess, (state, { id }) => ({
    ...state,
    professionals: state.professionals.filter(p => p.id !== id),
    loading: false
  })),
  on(ProfessionalsActions.deleteProfessionalFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Filter
  on(ProfessionalsActions.filterBySpecialty, (state, { specialty }) => ({
    ...state,
    specialtyFilter: specialty
  })),

  // Clear
  on(ProfessionalsActions.clearSelectedProfessional, (state) => ({
    ...state,
    selectedProfessional: null
  })),
  on(ProfessionalsActions.clearError, (state) => ({
    ...state,
    error: null
  }))
);
