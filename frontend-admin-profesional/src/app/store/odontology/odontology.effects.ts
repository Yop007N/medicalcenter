import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService, OdontologyApiService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as OdontologyActions from './odontology.actions';

@Injectable()
export class OdontologyEffects {
  private actions$ = inject(Actions);
  private odontologyApi = inject(OdontologyApiService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadOdontograms$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.loadOdontograms),
      switchMap(({ patientId }) =>
        this.odontologyApi.listOdontograms(patientId).pipe(
          map(odontograms => OdontologyActions.loadOdontogramsSuccess({ odontograms })),
          catchError(error => of(OdontologyActions.loadOdontogramsFailure({
            error: getApiErrorMessage(error, 'Error al cargar odontogramas')
          })))
        )
      )
    )
  );

  loadOdontogram$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.loadOdontogram),
      switchMap(({ id }) =>
        this.odontologyApi.getOdontogram(id).pipe(
          map(odontogram => OdontologyActions.loadOdontogramSuccess({ odontogram })),
          catchError(error => of(OdontologyActions.loadOdontogramFailure({
            error: getApiErrorMessage(error, 'Error al cargar odontograma')
          })))
        )
      )
    )
  );

  createOdontogram$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.createOdontogram),
      switchMap(({ odontogram }) =>
        this.odontologyApi.createOdontogram(odontogram).pipe(
          map(newOdontogram => OdontologyActions.createOdontogramSuccess({ odontogram: newOdontogram })),
          catchError(error => of(OdontologyActions.createOdontogramFailure({
            error: getApiErrorMessage(error, 'Error al crear odontograma')
          })))
        )
      )
    )
  );

  createOdontogramSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.createOdontogramSuccess),
      tap(({ odontogram }) => {
        this.notification.showSuccess('Odontograma creado correctamente');
      })
    ),
    { dispatch: false }
  );

  updateTooth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.updateTooth),
      switchMap(({ odontogramId, toothNumber, tooth }) =>
        this.odontologyApi.updateTooth(odontogramId, toothNumber, tooth).pipe(
          map(updatedTooth => OdontologyActions.updateToothSuccess({ tooth: updatedTooth })),
          catchError(error => of(OdontologyActions.updateToothFailure({
            error: getApiErrorMessage(error, 'Error al actualizar diente')
          })))
        )
      )
    )
  );

  updateToothSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.updateToothSuccess),
      tap(() => {
        this.notification.showSuccess('Diente actualizado');
      })
    ),
    { dispatch: false }
  );

  loadDentalTreatments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.loadDentalTreatments),
      switchMap(({ patientId }) =>
        this.odontologyApi.listDentalTreatments(patientId).pipe(
          map(treatments => OdontologyActions.loadDentalTreatmentsSuccess({ treatments })),
          catchError(error => of(OdontologyActions.loadDentalTreatmentsFailure({
            error: getApiErrorMessage(error, 'Error al cargar tratamientos')
          })))
        )
      )
    )
  );

  loadDentalTreatment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.loadDentalTreatment),
      switchMap(({ id }) =>
        this.odontologyApi.getDentalTreatment(id).pipe(
          map(treatment => OdontologyActions.loadDentalTreatmentSuccess({ treatment })),
          catchError(error => of(OdontologyActions.loadDentalTreatmentFailure({
            error: getApiErrorMessage(error, 'Error al cargar tratamiento')
          })))
        )
      )
    )
  );

  createDentalTreatment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.createDentalTreatment),
      switchMap(({ treatment }) =>
        this.odontologyApi.createDentalTreatment(treatment).pipe(
          map(newTreatment => OdontologyActions.createDentalTreatmentSuccess({ treatment: newTreatment })),
          catchError(error => of(OdontologyActions.createDentalTreatmentFailure({
            error: getApiErrorMessage(error, 'Error al crear tratamiento')
          })))
        )
      )
    )
  );

  createDentalTreatmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.createDentalTreatmentSuccess),
      tap(({ treatment }) => {
        this.notification.showSuccess('Tratamiento creado correctamente');
        this.router.navigate(['/odontology/treatments', treatment.id]);
      })
    ),
    { dispatch: false }
  );

  updateDentalTreatment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.updateDentalTreatment),
      switchMap(({ id, treatment }) =>
        this.odontologyApi.updateDentalTreatment(id, treatment).pipe(
          map(updatedTreatment => OdontologyActions.updateDentalTreatmentSuccess({ treatment: updatedTreatment })),
          catchError(error => of(OdontologyActions.updateDentalTreatmentFailure({
            error: getApiErrorMessage(error, 'Error al actualizar tratamiento')
          })))
        )
      )
    )
  );

  updateDentalTreatmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.updateDentalTreatmentSuccess),
      tap(() => {
        this.notification.showSuccess('Tratamiento actualizado correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteDentalTreatment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.deleteDentalTreatment),
      switchMap(({ id }) =>
        this.odontologyApi.deleteDentalTreatment(id).pipe(
          map(() => OdontologyActions.deleteDentalTreatmentSuccess({ id })),
          catchError(error => of(OdontologyActions.deleteDentalTreatmentFailure({
            error: getApiErrorMessage(error, 'Error al eliminar tratamiento')
          })))
        )
      )
    )
  );

  deleteDentalTreatmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OdontologyActions.deleteDentalTreatmentSuccess),
      tap(() => {
        this.notification.showSuccess('Tratamiento eliminado correctamente');
        this.router.navigate(['/odontology/treatments']);
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        OdontologyActions.loadOdontogramsFailure,
        OdontologyActions.loadOdontogramFailure,
        OdontologyActions.createOdontogramFailure,
        OdontologyActions.updateToothFailure,
        OdontologyActions.loadDentalTreatmentsFailure,
        OdontologyActions.loadDentalTreatmentFailure,
        OdontologyActions.createDentalTreatmentFailure,
        OdontologyActions.updateDentalTreatmentFailure,
        OdontologyActions.deleteDentalTreatmentFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
