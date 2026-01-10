import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuditState } from './audit.reducer';

export const selectAuditState = createFeatureSelector<AuditState>('audit');

export const selectAuditLogs = createSelector(
  selectAuditState,
  state => state.logs
);

export const selectTotalLogs = createSelector(
  selectAuditState,
  state => state.totalLogs
);

export const selectEntityHistory = createSelector(
  selectAuditState,
  state => state.entityHistory
);

export const selectUserActivity = createSelector(
  selectAuditState,
  state => state.userActivity
);

export const selectComplianceReport = createSelector(
  selectAuditState,
  state => state.complianceReport
);

export const selectAuditLoading = createSelector(
  selectAuditState,
  state => state.loading
);

export const selectAuditError = createSelector(
  selectAuditState,
  state => state.error
);
