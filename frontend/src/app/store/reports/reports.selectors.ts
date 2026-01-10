import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ReportsState } from './reports.reducer';

export const selectReportsState = createFeatureSelector<ReportsState>('reports');

export const selectMedicalReport = createSelector(
  selectReportsState,
  state => state.medicalReport
);

export const selectFinancialReport = createSelector(
  selectReportsState,
  state => state.financialReport
);

export const selectAppointmentsReport = createSelector(
  selectReportsState,
  state => state.appointmentsReport
);

export const selectQuickStats = createSelector(
  selectReportsState,
  state => state.quickStats
);

export const selectReportsLoading = createSelector(
  selectReportsState,
  state => state.loading
);

export const selectReportsExporting = createSelector(
  selectReportsState,
  state => state.exporting
);

export const selectReportsError = createSelector(
  selectReportsState,
  state => state.error
);
