import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProfessionalsState } from './professionals.reducer';

export const selectProfessionalsState = createFeatureSelector<ProfessionalsState>('professionals');

export const selectAllProfessionals = createSelector(
  selectProfessionalsState,
  (state) => state.professionals
);

export const selectFilteredProfessionals = createSelector(
  selectProfessionalsState,
  (state) => {
    if (!state.specialtyFilter) {
      return state.professionals;
    }
    return state.professionals.filter(p =>
      p.specialty?.toLowerCase().includes(state.specialtyFilter.toLowerCase())
    );
  }
);

export const selectSelectedProfessional = createSelector(
  selectProfessionalsState,
  (state) => state.selectedProfessional
);

export const selectProfessionalsLoading = createSelector(
  selectProfessionalsState,
  (state) => state.loading
);

export const selectProfessionalsError = createSelector(
  selectProfessionalsState,
  (state) => state.error
);

export const selectSpecialtyFilter = createSelector(
  selectProfessionalsState,
  (state) => state.specialtyFilter
);

export const selectProfessionalById = (id: number) => createSelector(
  selectAllProfessionals,
  (professionals) => professionals.find(p => p.id === id)
);

export const selectActiveProfessionals = createSelector(
  selectAllProfessionals,
  (professionals) => professionals.filter(p => p.is_active)
);

export const selectSpecialties = createSelector(
  selectAllProfessionals,
  (professionals) => [...new Set(professionals.map(p => p.specialty).filter(Boolean))]
);
