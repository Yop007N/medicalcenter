import { createAction, props } from '@ngrx/store';
import {
  MedicalReport,
  FinancialReport,
  AppointmentsReport,
  QuickStats,
  ReportFilter
} from '../../models/report.model';

// Load Medical Report
export const loadMedicalReport = createAction(
  '[Reports] Load Medical Report',
  props<{ filter: ReportFilter }>()
);
export const loadMedicalReportSuccess = createAction(
  '[Reports] Load Medical Report Success',
  props<{ report: MedicalReport }>()
);
export const loadMedicalReportFailure = createAction(
  '[Reports] Load Medical Report Failure',
  props<{ error: string }>()
);

// Load Financial Report
export const loadFinancialReport = createAction(
  '[Reports] Load Financial Report',
  props<{ filter: ReportFilter }>()
);
export const loadFinancialReportSuccess = createAction(
  '[Reports] Load Financial Report Success',
  props<{ report: FinancialReport }>()
);
export const loadFinancialReportFailure = createAction(
  '[Reports] Load Financial Report Failure',
  props<{ error: string }>()
);

// Load Appointments Report
export const loadAppointmentsReport = createAction(
  '[Reports] Load Appointments Report',
  props<{ filter: ReportFilter }>()
);
export const loadAppointmentsReportSuccess = createAction(
  '[Reports] Load Appointments Report Success',
  props<{ report: AppointmentsReport }>()
);
export const loadAppointmentsReportFailure = createAction(
  '[Reports] Load Appointments Report Failure',
  props<{ error: string }>()
);

// Load Quick Stats
export const loadQuickStats = createAction('[Reports] Load Quick Stats');
export const loadQuickStatsSuccess = createAction(
  '[Reports] Load Quick Stats Success',
  props<{ stats: QuickStats }>()
);
export const loadQuickStatsFailure = createAction(
  '[Reports] Load Quick Stats Failure',
  props<{ error: string }>()
);

// Export Report
export const exportReport = createAction(
  '[Reports] Export Report',
  props<{ reportType: string; format: string; filter: ReportFilter }>()
);
export const exportReportSuccess = createAction(
  '[Reports] Export Report Success'
);
export const exportReportFailure = createAction(
  '[Reports] Export Report Failure',
  props<{ error: string }>()
);

// Clear
export const clearReportsState = createAction('[Reports] Clear State');
export const clearError = createAction('[Reports] Clear Error');
