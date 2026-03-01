import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { AppointmentsApiService, NotificationService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as AppointmentsActions from './appointments.actions';

@Injectable()
export class AppointmentsEffects {
  private actions$ = inject(Actions);
  private appointmentsApi = inject(AppointmentsApiService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadAppointments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.loadAppointments),
      switchMap(({ patientId, professionalId, specialtyKey }) =>
        this.appointmentsApi.list(patientId, professionalId, specialtyKey).pipe(
          map((appointments) => AppointmentsActions.loadAppointmentsSuccess({ appointments })),
          catchError(error => of(AppointmentsActions.loadAppointmentsFailure({
            error: getApiErrorMessage(error, 'Error al cargar citas')
          })))
        )
      )
    )
  );

  loadAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.loadAppointment),
      switchMap(({ id }) =>
        this.appointmentsApi.getById(id).pipe(
          map(appointment => AppointmentsActions.loadAppointmentSuccess({ appointment })),
          catchError(error => of(AppointmentsActions.loadAppointmentFailure({
            error: getApiErrorMessage(error, 'Error al cargar cita')
          })))
        )
      )
    )
  );

  createAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.createAppointment),
      switchMap(({ appointment, navigationQueryParams }) =>
        this.appointmentsApi.create(appointment).pipe(
          map(newAppointment => AppointmentsActions.createAppointmentSuccess({
            appointment: newAppointment,
            navigationQueryParams
          })),
          catchError(error => of(AppointmentsActions.createAppointmentFailure({
            error: getApiErrorMessage(error, 'Error al crear cita')
          })))
        )
      )
    )
  );

  createAppointmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.createAppointmentSuccess),
      tap(({ appointment, navigationQueryParams }) => {
        this.notification.showSuccess('Cita creada correctamente');
        this.router.navigate(['/appointments', appointment.id], { queryParams: navigationQueryParams });
      })
    ),
    { dispatch: false }
  );

  updateAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.updateAppointment),
      switchMap(({ id, appointment, navigationQueryParams }) =>
        this.appointmentsApi.update(id, appointment).pipe(
          map(updatedAppointment => AppointmentsActions.updateAppointmentSuccess({
            appointment: updatedAppointment,
            navigationQueryParams
          })),
          catchError(error => of(AppointmentsActions.updateAppointmentFailure({
            error: getApiErrorMessage(error, 'Error al actualizar cita')
          })))
        )
      )
    )
  );

  updateAppointmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.updateAppointmentSuccess),
      tap(({ appointment, navigationQueryParams }) => {
        this.notification.showSuccess('Cita actualizada correctamente');
        this.router.navigate(['/appointments', appointment.id], { queryParams: navigationQueryParams });
      })
    ),
    { dispatch: false }
  );

  deleteAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.deleteAppointment),
      switchMap(({ id, navigationQueryParams }) =>
        this.appointmentsApi.delete(id).pipe(
          map(() => AppointmentsActions.deleteAppointmentSuccess({ id, navigationQueryParams })),
          catchError(error => of(AppointmentsActions.deleteAppointmentFailure({
            error: getApiErrorMessage(error, 'Error al eliminar cita')
          })))
        )
      )
    )
  );

  deleteAppointmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.deleteAppointmentSuccess),
      tap(({ navigationQueryParams }) => {
        this.notification.showSuccess('Cita eliminada correctamente');
        this.router.navigate(['/appointments'], { queryParams: navigationQueryParams });
      })
    ),
    { dispatch: false }
  );

  confirmAppointment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentsActions.confirmAppointment),
      switchMap(({ id }) =>
        this.appointmentsApi.confirm(id).pipe(
          map(appointment => AppointmentsActions.confirmAppointmentSuccess({ appointment })),
          catchError(error => of(AppointmentsActions.confirmAppointmentFailure({
            error: getApiErrorMessage(error, 'Error al confirmar cita')
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
        this.appointmentsApi.cancel(id, reason).pipe(
          map(appointment => AppointmentsActions.cancelAppointmentSuccess({ appointment })),
          catchError(error => of(AppointmentsActions.cancelAppointmentFailure({
            error: getApiErrorMessage(error, 'Error al cancelar cita')
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
        this.appointmentsApi.complete(id).pipe(
          map(appointment => AppointmentsActions.completeAppointmentSuccess({ appointment })),
          catchError(error => of(AppointmentsActions.completeAppointmentFailure({
            error: getApiErrorMessage(error, 'Error al completar cita')
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
