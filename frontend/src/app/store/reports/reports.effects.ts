import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  MedicalReport,
  FinancialReport,
  AppointmentsReport,
  QuickStats
} from '../../models/report.model';
import { NotificationService } from '../../core/services';
import * as ReportsActions from './reports.actions';

@Injectable()
export class ReportsEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  loadMedicalReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.loadMedicalReport),
      switchMap(({ filter }) => {
        let params = new HttpParams();
        if (filter.start_date) params = params.set('start_date', filter.start_date);
        if (filter.end_date) params = params.set('end_date', filter.end_date);
        if (filter.professional_id) params = params.set('professional_id', filter.professional_id.toString());

        return this.http.get<MedicalReport>(`${environment.apiUrl}/reports/medical`, { params }).pipe(
          map(report => ReportsActions.loadMedicalReportSuccess({ report })),
          catchError(error => of(ReportsActions.loadMedicalReportFailure({
            error: error.error?.msg || 'Error al cargar reporte médico'
          })))
        );
      })
    )
  );

  loadFinancialReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.loadFinancialReport),
      switchMap(({ filter }) => {
        let params = new HttpParams();
        if (filter.start_date) params = params.set('start_date', filter.start_date);
        if (filter.end_date) params = params.set('end_date', filter.end_date);

        return this.http.get<FinancialReport>(`${environment.apiUrl}/reports/financial`, { params }).pipe(
          map(report => ReportsActions.loadFinancialReportSuccess({ report })),
          catchError(error => of(ReportsActions.loadFinancialReportFailure({
            error: error.error?.msg || 'Error al cargar reporte financiero'
          })))
        );
      })
    )
  );

  loadAppointmentsReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.loadAppointmentsReport),
      switchMap(({ filter }) => {
        let params = new HttpParams();
        if (filter.start_date) params = params.set('start_date', filter.start_date);
        if (filter.end_date) params = params.set('end_date', filter.end_date);
        if (filter.professional_id) params = params.set('professional_id', filter.professional_id.toString());
        if (filter.status) params = params.set('status', filter.status);

        return this.http.get<AppointmentsReport>(`${environment.apiUrl}/reports/appointments`, { params }).pipe(
          map(report => ReportsActions.loadAppointmentsReportSuccess({ report })),
          catchError(error => of(ReportsActions.loadAppointmentsReportFailure({
            error: error.error?.msg || 'Error al cargar reporte de citas'
          })))
        );
      })
    )
  );

  loadQuickStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.loadQuickStats),
      switchMap(() =>
        this.http.get<QuickStats>(`${environment.apiUrl}/reports/quick/stats`).pipe(
          map(stats => ReportsActions.loadQuickStatsSuccess({ stats })),
          catchError(error => of(ReportsActions.loadQuickStatsFailure({
            error: error.error?.msg || 'Error al cargar estadísticas rápidas'
          })))
        )
      )
    )
  );

  exportReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.exportReport),
      switchMap(({ reportType, format, filter }) => {
        let params = new HttpParams();
        params = params.set('format', format);
        if (filter.start_date) params = params.set('start_date', filter.start_date);
        if (filter.end_date) params = params.set('end_date', filter.end_date);

        return this.http.get(`${environment.apiUrl}/reports/${reportType}/export`, {
          params,
          responseType: 'blob'
        }).pipe(
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
            error: error.error?.msg || 'Error al exportar reporte'
          })))
        );
      })
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
