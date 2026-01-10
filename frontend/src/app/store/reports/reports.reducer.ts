import { createReducer, on } from '@ngrx/store';
import {
  MedicalReport,
  FinancialReport,
  AppointmentsReport,
  QuickStats
} from '../../models/report.model';
import * as ReportsActions from './reports.actions';

export interface ReportsState {
  medicalReport: MedicalReport | null;
  financialReport: FinancialReport | null;
  appointmentsReport: AppointmentsReport | null;
  quickStats: QuickStats | null;
  loading: boolean;
  exporting: boolean;
  error: string | null;
}

export const initialState: ReportsState = {
  medicalReport: null,
  financialReport: null,
  appointmentsReport: null,
  quickStats: null,
  loading: false,
  exporting: false,
  error: null
};

export const reportsReducer = createReducer(
  initialState,

  // Medical Report
  on(ReportsActions.loadMedicalReport, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ReportsActions.loadMedicalReportSuccess, (state, { report }) => ({
    ...state,
    medicalReport: report,
    loading: false
  })),
  on(ReportsActions.loadMedicalReportFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Financial Report
  on(ReportsActions.loadFinancialReport, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ReportsActions.loadFinancialReportSuccess, (state, { report }) => ({
    ...state,
    financialReport: report,
    loading: false
  })),
  on(ReportsActions.loadFinancialReportFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Appointments Report
  on(ReportsActions.loadAppointmentsReport, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ReportsActions.loadAppointmentsReportSuccess, (state, { report }) => ({
    ...state,
    appointmentsReport: report,
    loading: false
  })),
  on(ReportsActions.loadAppointmentsReportFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Quick Stats
  on(ReportsActions.loadQuickStats, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ReportsActions.loadQuickStatsSuccess, (state, { stats }) => ({
    ...state,
    quickStats: stats,
    loading: false
  })),
  on(ReportsActions.loadQuickStatsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Export
  on(ReportsActions.exportReport, state => ({
    ...state,
    exporting: true,
    error: null
  })),
  on(ReportsActions.exportReportSuccess, state => ({
    ...state,
    exporting: false
  })),
  on(ReportsActions.exportReportFailure, (state, { error }) => ({
    ...state,
    exporting: false,
    error
  })),

  // Clear
  on(ReportsActions.clearReportsState, () => initialState),
  on(ReportsActions.clearError, state => ({
    ...state,
    error: null
  }))
);
