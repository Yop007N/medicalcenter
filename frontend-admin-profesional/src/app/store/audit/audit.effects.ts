import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AuditLog,
  EntityHistory,
  UserActivity,
  ComplianceReport
} from '../../models/report.model';
import { NotificationService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import { toItemsArray } from '../pagination.adapter';
import * as AuditActions from './audit.actions';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

@Injectable()
export class AuditEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  loadAuditLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditActions.loadAuditLogs),
      switchMap(({ filter }) => {
        let params = new HttpParams();
        if (filter.user_id) params = params.set('user_id', filter.user_id.toString());
        if (filter.entity_type) params = params.set('entity_type', filter.entity_type);
        if (filter.entity_id) params = params.set('entity_id', filter.entity_id.toString());
        if (filter.action) params = params.set('action', filter.action);
        if (filter.start_date) params = params.set('start_date', filter.start_date);
        if (filter.end_date) params = params.set('end_date', filter.end_date);
        if (filter.page) params = params.set('page', filter.page.toString());
        if (filter.per_page) params = params.set('per_page', filter.per_page.toString());

        return this.http.get<PaginatedResponse<AuditLog>>(`${environment.apiUrl}/audit/logs`, { params }).pipe(
          map(response => AuditActions.loadAuditLogsSuccess({
            logs: toItemsArray(response),
            total: response.total
          })),
          catchError(error => of(AuditActions.loadAuditLogsFailure({
            error: getApiErrorMessage(error, 'Error al cargar logs de auditoria')
          })))
        );
      })
    )
  );

  loadEntityHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditActions.loadEntityHistory),
      switchMap(({ entityType, entityId }) =>
        this.http.get<EntityHistory>(`${environment.apiUrl}/audit/entity/${entityType}/${entityId}/history`).pipe(
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
        this.http.get<UserActivity>(`${environment.apiUrl}/audit/user/${userId}/activity`).pipe(
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
      switchMap(({ startDate, endDate }) => {
        const params = new HttpParams()
          .set('start_date', startDate)
          .set('end_date', endDate);

        return this.http.get<ComplianceReport>(`${environment.apiUrl}/audit/compliance/report`, { params }).pipe(
          map(report => AuditActions.loadComplianceReportSuccess({ report })),
          catchError(error => of(AuditActions.loadComplianceReportFailure({
            error: getApiErrorMessage(error, 'Error al cargar reporte de cumplimiento')
          })))
        );
      })
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
