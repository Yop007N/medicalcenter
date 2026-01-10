import { createReducer, on } from '@ngrx/store';
import {
  AuditLog,
  EntityHistory,
  UserActivity,
  ComplianceReport
} from '../../models/report.model';
import * as AuditActions from './audit.actions';

export interface AuditState {
  logs: AuditLog[];
  totalLogs: number;
  entityHistory: EntityHistory | null;
  userActivity: UserActivity | null;
  complianceReport: ComplianceReport | null;
  loading: boolean;
  error: string | null;
}

export const initialState: AuditState = {
  logs: [],
  totalLogs: 0,
  entityHistory: null,
  userActivity: null,
  complianceReport: null,
  loading: false,
  error: null
};

export const auditReducer = createReducer(
  initialState,

  // Load Audit Logs
  on(AuditActions.loadAuditLogs, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AuditActions.loadAuditLogsSuccess, (state, { logs, total }) => ({
    ...state,
    logs,
    totalLogs: total,
    loading: false
  })),
  on(AuditActions.loadAuditLogsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Entity History
  on(AuditActions.loadEntityHistory, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AuditActions.loadEntityHistorySuccess, (state, { history }) => ({
    ...state,
    entityHistory: history,
    loading: false
  })),
  on(AuditActions.loadEntityHistoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // User Activity
  on(AuditActions.loadUserActivity, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AuditActions.loadUserActivitySuccess, (state, { activity }) => ({
    ...state,
    userActivity: activity,
    loading: false
  })),
  on(AuditActions.loadUserActivityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Compliance Report
  on(AuditActions.loadComplianceReport, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AuditActions.loadComplianceReportSuccess, (state, { report }) => ({
    ...state,
    complianceReport: report,
    loading: false
  })),
  on(AuditActions.loadComplianceReportFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear
  on(AuditActions.clearAuditState, () => initialState),
  on(AuditActions.clearError, state => ({
    ...state,
    error: null
  }))
);
