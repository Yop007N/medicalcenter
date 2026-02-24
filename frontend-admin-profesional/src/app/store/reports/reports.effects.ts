import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService, ReportsApiService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as ReportsActions from './reports.actions';

@Injectable()
export class ReportsEffects {
  private actions$ = inject(Actions);
  private reportsApi = inject(ReportsApiService);
  private notification = inject(NotificationService);

  loadMedicalReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.loadMedicalReport),
      switchMap(({ filter }) =>
        this.reportsApi.getMedicalReport(filter).pipe(
          map(report => ReportsActions.loadMedicalReportSuccess({ report })),
          catchError(error => of(ReportsActions.loadMedicalReportFailure({
            error: getApiErrorMessage(error, 'Error al cargar reporte medico')
          })))
        )
      )
    )
  );

  loadFinancialReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.loadFinancialReport),
      switchMap(({ filter }) =>
        this.reportsApi.getFinancialReport(filter).pipe(
          map(report => ReportsActions.loadFinancialReportSuccess({ report })),
          catchError(error => of(ReportsActions.loadFinancialReportFailure({
            error: getApiErrorMessage(error, 'Error al cargar reporte financiero')
          })))
        )
      )
    )
  );

  loadAppointmentsReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.loadAppointmentsReport),
      switchMap(({ filter }) =>
        this.reportsApi.getAppointmentsReport(filter).pipe(
          map(report => ReportsActions.loadAppointmentsReportSuccess({ report })),
          catchError(error => of(ReportsActions.loadAppointmentsReportFailure({
            error: getApiErrorMessage(error, 'Error al cargar reporte de citas')
          })))
        )
      )
    )
  );

  loadQuickStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.loadQuickStats),
      switchMap(() =>
        this.reportsApi.getQuickStats().pipe(
          map(stats => ReportsActions.loadQuickStatsSuccess({ stats })),
          catchError(error => of(ReportsActions.loadQuickStatsFailure({
            error: getApiErrorMessage(error, 'Error al cargar estadisticas rapidas')
          })))
        )
      )
    )
  );

  exportReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.exportReport),
      switchMap(({ reportType, format, filter }) =>
        this.reportsApi.exportReport(reportType, format, filter).pipe(
          tap(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.${format}`;
            link.click();
            window.URL.revokeObjectURL(url);
          }),
          map(() => ReportsActions.exportReportSuccess()),
          catchError(error => of(ReportsActions.exportReportFailure({
            error: getApiErrorMessage(error, 'Error al exportar reporte')
          })))
        )
      )
    )
  );

  exportSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.exportReportSuccess),
      tap(() => {
        this.notification.showSuccess('Reporte exportado correctamente');
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ReportsActions.loadMedicalReportFailure,
        ReportsActions.loadFinancialReportFailure,
        ReportsActions.loadAppointmentsReportFailure,
        ReportsActions.loadQuickStatsFailure,
        ReportsActions.exportReportFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}

