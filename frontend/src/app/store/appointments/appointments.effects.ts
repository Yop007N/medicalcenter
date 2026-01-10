import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Appointment } from '../../models';
import { NotificationService } from '../../core/services';
import * as AppointmentsActions from './appointments.actions';

@Injectable()
export class AppointmentsEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadAppointments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.loadAppointments),
      switchMap(() =>
        this.http.get<Appointment[]>(`${environment.apiUrl}/appointments`).pipe(
          map(appointments => AppointmentsActions.loadAppointmentsSuccess({ appointments })),
          catchError(error => of(AppointmentsActions.loadAppointmentsFailure({
            error: error.error?.message || 'Error al cargar citas'
          })))
        )
      )
    )
  );

  loadAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.loadAppointment),
      switchMap(({ id }) =>
        this.http.get<Appointment>(`${environment.apiUrl}/appointments/${id}`).pipe(
          map(appointment => AppointmentsActions.loadAppointmentSuccess({ appointment })),
          catchError(error => of(AppointmentsActions.loadAppointmentFailure({
            error: error.error?.message || 'Error al cargar cita'
          })))
        )
      )
    )
  );

  createAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.createAppointment),
      switchMap(({ appointment }) =>
        this.http.post<Appointment>(`${environment.apiUrl}/appointments`, appointment).pipe(
          map(newAppointment => AppointmentsActions.createAppointmentSuccess({ appointment: newAppointment })),
          catchError(error => of(AppointmentsActions.createAppointmentFailure({
            error: error.error?.message || 'Error al crear cita'
          })))
        )
      )
    )
  );

  createAppointmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.createAppointmentSuccess),
      tap(({ appointment }) => {
        this.notification.showSuccess('Cita creada correctamente');
        this.router.navigate(['/appointments', appointment.id]);
      })
    ),
    { dispatch: false }
  );

  updateAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.updateAppointment),
      switchMap(({ id, appointment }) =>
        this.http.put<Appointment>(`${environment.apiUrl}/appointments/${id}`, appointment).pipe(
          map(updatedAppointment => AppointmentsActions.updateAppointmentSuccess({ appointment: updatedAppointment })),
          catchError(error => of(AppointmentsActions.updateAppointmentFailure({
            error: error.error?.message || 'Error al actualizar cita'
          })))
        )
      )
    )
  );

  updateAppointmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.updateAppointmentSuccess),
      tap(({ appointment }) => {
        this.notification.showSuccess('Cita actualizada correctamente');
        this.router.navigate(['/appointments', appointment.id]);
      })
    ),
    { dispatch: false }
  );

  deleteAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.deleteAppointment),
      switchMap(({ id }) =>
        this.http.delete(`${environment.apiUrl}/appointments/${id}`).pipe(
          map(() => AppointmentsActions.deleteAppointmentSuccess({ id })),
          catchError(error => of(AppointmentsActions.deleteAppointmentFailure({
            error: error.error?.message || 'Error al eliminar cita'
          })))
        )
      )
    )
  );

  deleteAppointmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.deleteAppointmentSuccess),
      tap(() => {
        this.notification.showSuccess('Cita eliminada correctamente');
        this.router.navigate(['/appointments']);
      })
    ),
    { dispatch: false }
  );

  confirmAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.confirmAppointment),
      switchMap(({ id }) =>
        this.http.post<Appointment>(`${environment.apiUrl}/appointments/${id}/confirm`, {}).pipe(
          map(appointment => AppointmentsActions.confirmAppointmentSuccess({ appointment })),
          catchError(error => of(AppointmentsActions.confirmAppointmentFailure({
            error: error.error?.message || 'Error al confirmar cita'
          })))
        )
      )
    )
  );

  confirmAppointmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.confirmAppointmentSuccess),
      tap(() => {
        this.notification.showSuccess('Cita confirmada');
      })
    ),
    { dispatch: false }
  );

  cancelAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.cancelAppointment),
      switchMap(({ id, reason }) =>
        this.http.post<Appointment>(`${environment.apiUrl}/appointments/${id}/cancel`, { reason }).pipe(
          map(appointment => AppointmentsActions.cancelAppointmentSuccess({ appointment })),
          catchError(error => of(AppointmentsActions.cancelAppointmentFailure({
            error: error.error?.message || 'Error al cancelar cita'
          })))
        )
      )
    )
  );

  cancelAppointmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.cancelAppointmentSuccess),
      tap(() => {
        this.notification.showSuccess('Cita cancelada');
      })
    ),
    { dispatch: false }
  );

  completeAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.completeAppointment),
      switchMap(({ id }) =>
        this.http.post<Appointment>(`${environment.apiUrl}/appointments/${id}/complete`, {}).pipe(
          map(appointment => AppointmentsActions.completeAppointmentSuccess({ appointment })),
          catchError(error => of(AppointmentsActions.completeAppointmentFailure({
            error: error.error?.message || 'Error al completar cita'
          })))
        )
      )
    )
  );

  completeAppointmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.completeAppointmentSuccess),
      tap(() => {
        this.notification.showSuccess('Cita completada');
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AppointmentsActions.loadAppointmentsFailure,
        AppointmentsActions.loadAppointmentFailure,
        AppointmentsActions.createAppointmentFailure,
        AppointmentsActions.updateAppointmentFailure,
        AppointmentsActions.deleteAppointmentFailure,
        AppointmentsActions.confirmAppointmentFailure,
        AppointmentsActions.cancelAppointmentFailure,
        AppointmentsActions.completeAppointmentFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
