import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { AuditApiService, NotificationService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as AuditActions from './audit.actions';

@Injectable()
export class AuditEffects {
  private actions$ = inject(Actions);
  private auditApi = inject(AuditApiService);
  private notification = inject(NotificationService);

  loadAuditLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditActions.loadAuditLogs),
      switchMap(({ filter }) =>
        this.auditApi.listLogs(filter).pipe(
          map(({ logs, total }) => AuditActions.loadAuditLogsSuccess({
            logs,
            total
          })),
          catchError(error => of(AuditActions.loadAuditLogsFailure({
            error: getApiErrorMessage(error, 'Error al cargar logs de auditoria')
          })))
        )
      )
    )
  );

  loadEntityHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditActions.loadEntityHistory),
      switchMap(({ entityType, entityId }) =>
        this.auditApi.getEntityHistory(entityType, entityId).pipe(
          map(history => AuditActions.loadEntityHistorySuccess({ history })),
          catchError(error => of(AuditActions.loadEntityHistoryFailure({
            error: getApiErrorMessage(error, 'Error al cargar historial de entidad')
          })))
        )
      )
    )
  );

  loadUserActivity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditActions.loadUserActivity),
      switchMap(({ userId }) =>
        this.auditApi.getUserActivity(userId).pipe(
          map(activity => AuditActions.loadUserActivitySuccess({ activity })),
          catchError(error => of(AuditActions.loadUserActivityFailure({
            error: getApiErrorMessage(error, 'Error al cargar actividad de usuario')
          })))
        )
      )
    )
  );

  loadComplianceReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditActions.loadComplianceReport),
      switchMap(({ startDate, endDate }) =>
        this.auditApi.getComplianceReport(startDate, endDate).pipe(
          map(report => AuditActions.loadComplianceReportSuccess({ report })),
          catchError(error => of(AuditActions.loadComplianceReportFailure({
            error: getApiErrorMessage(error, 'Error al cargar reporte de cumplimiento')
          })))
        )
      )
    )
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AuditActions.loadAuditLogsFailure,
        AuditActions.loadEntityHistoryFailure,
        AuditActions.loadUserActivityFailure,
        AuditActions.loadComplianceReportFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
