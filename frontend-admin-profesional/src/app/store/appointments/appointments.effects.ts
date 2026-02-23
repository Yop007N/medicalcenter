import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Appointment } from '../../models';
import { NotificationService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import { CollectionResponse, toItemsArray } from '../pagination.adapter';
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
        this.http.get<CollectionResponse<Appointment>>(`${environment.apiUrl}/appointments`).pipe(
          map((response) => {
            const appointments = toItemsArray(response);
            return AppointmentsActions.loadAppointmentsSuccess({ appointments });
          }),
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
        this.http.get<Appointment>(`${environment.apiUrl}/appointments/${id}`).pipe(
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
      switchMap(({ appointment }) =>
        this.http.post<Appointment>(`${environment.apiUrl}/appointments`, appointment).pipe(
          map(newAppointment => AppointmentsActions.createAppointmentSuccess({ appointment: newAppointment })),
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
            error: getApiErrorMessage(error, 'Error al actualizar cita')
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
            error: getApiErrorMessage(error, 'Error al eliminar cita')
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
        this.http.put<Appointment>(`${environment.apiUrl}/appointments/${id}`, {
          status: 'cancelled',
          notes: reason
        }).pipe(
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
        this.http.put<Appointment>(`${environment.apiUrl}/appointments/${id}`, {
          status: 'completed'
        }).pipe(
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
