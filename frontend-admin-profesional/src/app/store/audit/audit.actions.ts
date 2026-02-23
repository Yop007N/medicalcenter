import { createAction, props } from '@ngrx/store';
import {
  AuditLog,
  AuditFilter,
  EntityHistory,
  UserActivity,
  ComplianceReport
} from '../../models/report.model';

// Load Audit Logs
export const loadAuditLogs = createAction(
  '[Audit] Load Audit Logs',
  props<{ filter: AuditFilter }>()
);
export const loadAuditLogsSuccess = createAction(
  '[Audit] Load Audit Logs Success',
  props<{ logs: AuditLog[]; total: number }>()
);
export const loadAuditLogsFailure = createAction(
  '[Audit] Load Audit Logs Failure',
  props<{ error: string }>()
);

// Load Entity History
export const loadEntityHistory = createAction(
  '[Audit] Load Entity History',
  props<{ entityType: string; entityId: number }>()
);
export const loadEntityHistorySuccess = createAction(
  '[Audit] Load Entity History Success',
  props<{ history: EntityHistory }>()
);
export const loadEntityHistoryFailure = createAction(
  '[Audit] Load Entity History Failure',
  props<{ error: string }>()
);

// Load User Activity
export const loadUserActivity = createAction(
  '[Audit] Load User Activity',
  props<{ userId: number }>()
);
export const loadUserActivitySuccess = createAction(
  '[Audit] Load User Activity Success',
  props<{ activity: UserActivity }>()
);
export const loadUserActivityFailure = createAction(
  '[Audit] Load User Activity Failure',
  props<{ error: string }>()
);

// Load Compliance Report
export const loadComplianceReport = createAction(
  '[Audit] Load Compliance Report',
  props<{ startDate: string; endDate: string }>()
);
export const loadComplianceReportSuccess = createAction(
  '[Audit] Load Compliance Report Success',
  props<{ report: ComplianceReport }>()
);
export const loadComplianceReportFailure = createAction(
  '[Audit] Load Compliance Report Failure',
  props<{ error: string }>()
);

// Clear
export const clearAuditState = createAction('[Audit] Clear State');
export const clearError = createAction('[Audit] Clear Error');
