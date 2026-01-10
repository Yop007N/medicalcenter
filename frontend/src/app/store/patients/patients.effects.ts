import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Patient } from '../../models';
import { NotificationService } from '../../core/services';
import * as PatientsActions from './patients.actions';

@Injectable()
export class PatientsEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadPatients$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.loadPatients),
      switchMap(() =>
        this.http.get<Patient[]>(`${environment.apiUrl}/patients`).pipe(
          map(patients => PatientsActions.loadPatientsSuccess({ patients })),
          catchError(error => of(PatientsActions.loadPatientsFailure({
            error: error.error?.message || 'Error al cargar pacientes'
          })))
        )
      )
    )
  );

  loadPatient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.loadPatient),
      switchMap(({ id }) =>
        this.http.get<Patient>(`${environment.apiUrl}/patients/${id}`).pipe(
          map(patient => PatientsActions.loadPatientSuccess({ patient })),
          catchError(error => of(PatientsActions.loadPatientFailure({
            error: error.error?.message || 'Error al cargar paciente'
          })))
        )
      )
    )
  );

  createPatient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.createPatient),
      switchMap(({ patient }) =>
        this.http.post<Patient>(`${environment.apiUrl}/patients`, patient).pipe(
          map(newPatient => PatientsActions.createPatientSuccess({ patient: newPatient })),
          catchError(error => of(PatientsActions.createPatientFailure({
            error: error.error?.message || 'Error al crear paciente'
          })))
        )
      )
    )
  );

  createPatientSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.createPatientSuccess),
      tap(({ patient }) => {
        this.notification.showSuccess('Paciente creado correctamente');
        this.router.navigate(['/patients', patient.id]);
      })
    ),
    { dispatch: false }
  );

  updatePatient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.updatePatient),
      switchMap(({ id, patient }) =>
        this.http.put<Patient>(`${environment.apiUrl}/patients/${id}`, patient).pipe(
          map(updatedPatient => PatientsActions.updatePatientSuccess({ patient: updatedPatient })),
          catchError(error => of(PatientsActions.updatePatientFailure({
            error: error.error?.message || 'Error al actualizar paciente'
          })))
        )
      )
    )
  );

  updatePatientSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.updatePatientSuccess),
      tap(() => {
        this.notification.showSuccess('Paciente actualizado correctamente');
      })
    ),
    { dispatch: false }
  );

  deletePatient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.deletePatient),
      switchMap(({ id }) =>
        this.http.delete(`${environment.apiUrl}/patients/${id}`).pipe(
          map(() => PatientsActions.deletePatientSuccess({ id })),
          catchError(error => of(PatientsActions.deletePatientFailure({
            error: error.error?.message || 'Error al eliminar paciente'
          })))
        )
      )
    )
  );

  deletePatientSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.deletePatientSuccess),
      tap(() => {
        this.notification.showSuccess('Paciente eliminado correctamente');
        this.router.navigate(['/patients']);
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        PatientsActions.loadPatientsFailure,
        PatientsActions.loadPatientFailure,
        PatientsActions.createPatientFailure,
        PatientsActions.updatePatientFailure,
        PatientsActions.deletePatientFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
