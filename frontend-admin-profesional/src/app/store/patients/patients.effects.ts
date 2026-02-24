import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Patient } from '../../models';
import { NotificationService, PatientsApiService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as PatientsActions from './patients.actions';

const normalizePatient = (patient: Partial<Patient>): Patient => ({
  id: patient.id ?? 0,
  first_name: patient.first_name ?? '',
  last_name: patient.last_name ?? '',
  email: patient.email ?? '',
  is_active: patient.is_active ?? true,
  created_at: patient.created_at ?? new Date().toISOString(),
  ...patient
});

@Injectable()
export class PatientsEffects {
  private actions$ = inject(Actions);
  private patientsApi = inject(PatientsApiService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadPatients$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.loadPatients),
      switchMap(() =>
        this.patientsApi.list().pipe(
          map((patients) => PatientsActions.loadPatientsSuccess({
            patients: patients.map((patient) => normalizePatient(patient))
          })),
          catchError(error => of(PatientsActions.loadPatientsFailure({
            error: getApiErrorMessage(error, 'Error al cargar pacientes')
          })))
        )
      )
    )
  );

  loadPatient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.loadPatient),
      switchMap(({ id }) =>
        this.patientsApi.getById(id).pipe(
          map(patient => PatientsActions.loadPatientSuccess({ patient: normalizePatient(patient) })),
          catchError(error => of(PatientsActions.loadPatientFailure({
            error: getApiErrorMessage(error, 'Error al cargar paciente')
          })))
        )
      )
    )
  );

  createPatient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PatientsActions.createPatient),
      switchMap(({ patient }) =>
        this.patientsApi.create(patient).pipe(
          map(newPatient => PatientsActions.createPatientSuccess({ patient: normalizePatient(newPatient) })),
          catchError(error => of(PatientsActions.createPatientFailure({
            error: getApiErrorMessage(error, 'Error al crear paciente')
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
        this.patientsApi.update(id, patient).pipe(
          map(updatedPatient => PatientsActions.updatePatientSuccess({ patient: normalizePatient(updatedPatient) })),
          catchError(error => of(PatientsActions.updatePatientFailure({
            error: getApiErrorMessage(error, 'Error al actualizar paciente')
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
        this.patientsApi.delete(id).pipe(
          map(() => PatientsActions.deletePatientSuccess({ id })),
          catchError(error => of(PatientsActions.deletePatientFailure({
            error: getApiErrorMessage(error, 'Error al eliminar paciente')
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
