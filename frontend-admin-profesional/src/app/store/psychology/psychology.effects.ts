import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService, PsychologyApiService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as PsychologyActions from './psychology.actions';

@Injectable()
export class PsychologyEffects {
  private actions$ = inject(Actions);
  private psychologyApi = inject(PsychologyApiService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadEvaluations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.loadEvaluations),
      switchMap(({ patientId }) =>
        this.psychologyApi.listEvaluations(patientId).pipe(
          map(evaluations => PsychologyActions.loadEvaluationsSuccess({ evaluations })),
          catchError(error => of(PsychologyActions.loadEvaluationsFailure({
            error: getApiErrorMessage(error, 'Error al cargar evaluaciones')
          })))
        )
      )
    )
  );

  loadEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.loadEvaluation),
      switchMap(({ id }) =>
        this.psychologyApi.getEvaluation(id).pipe(
          map(evaluation => PsychologyActions.loadEvaluationSuccess({ evaluation })),
          catchError(error => of(PsychologyActions.loadEvaluationFailure({
            error: getApiErrorMessage(error, 'Error al cargar evaluacion')
          })))
        )
      )
    )
  );

  createEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.createEvaluation),
      switchMap(({ evaluation }) =>
        this.psychologyApi.createEvaluation(evaluation).pipe(
          map(newEvaluation => PsychologyActions.createEvaluationSuccess({ evaluation: newEvaluation })),
          catchError(error => of(PsychologyActions.createEvaluationFailure({
            error: getApiErrorMessage(error, 'Error al crear evaluacion')
          })))
        )
      )
    )
  );

  createEvaluationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.createEvaluationSuccess),
      tap(({ evaluation }) => {
        this.notification.showSuccess('Evaluacion psicologica creada correctamente');
        this.router.navigate(['/psychology/evaluations', evaluation.id]);
      })
    ),
    { dispatch: false }
  );

  updateEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.updateEvaluation),
      switchMap(({ id, evaluation }) =>
        this.psychologyApi.updateEvaluation(id, evaluation).pipe(
          map(updatedEvaluation => PsychologyActions.updateEvaluationSuccess({ evaluation: updatedEvaluation })),
          catchError(error => of(PsychologyActions.updateEvaluationFailure({
            error: getApiErrorMessage(error, 'Error al actualizar evaluacion')
          })))
        )
      )
    )
  );

  updateEvaluationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.updateEvaluationSuccess),
      tap(() => {
        this.notification.showSuccess('Evaluacion actualizada correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.deleteEvaluation),
      switchMap(({ id }) =>
        this.psychologyApi.deleteEvaluation(id).pipe(
          map(() => PsychologyActions.deleteEvaluationSuccess({ id })),
          catchError(error => of(PsychologyActions.deleteEvaluationFailure({
            error: getApiErrorMessage(error, 'Error al eliminar evaluacion')
          })))
        )
      )
    )
  );

  deleteEvaluationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.deleteEvaluationSuccess),
      tap(() => {
        this.notification.showSuccess('Evaluacion eliminada correctamente');
        this.router.navigate(['/psychology/evaluations']);
      })
    ),
    { dispatch: false }
  );

  loadSessions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.loadSessions),
      switchMap(({ evaluationId }) =>
        this.psychologyApi.listSessions(evaluationId).pipe(
          map(sessions => PsychologyActions.loadSessionsSuccess({ sessions })),
          catchError(error => of(PsychologyActions.loadSessionsFailure({
            error: getApiErrorMessage(error, 'Error al cargar sesiones')
          })))
        )
      )
    )
  );

  loadSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.loadSession),
      switchMap(({ id }) =>
        this.psychologyApi.getSession(id).pipe(
          map(session => PsychologyActions.loadSessionSuccess({ session })),
          catchError(error => of(PsychologyActions.loadSessionFailure({
            error: getApiErrorMessage(error, 'Error al cargar sesion')
          })))
        )
      )
    )
  );

  createSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.createSession),
      switchMap(({ session }) =>
        this.psychologyApi.createSession(session).pipe(
          map(newSession => PsychologyActions.createSessionSuccess({ session: newSession })),
          catchError(error => of(PsychologyActions.createSessionFailure({
            error: getApiErrorMessage(error, 'Error al crear sesion')
          })))
        )
      )
    )
  );

  createSessionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.createSessionSuccess),
      tap(({ session }) => {
        this.notification.showSuccess('Sesion de terapia registrada correctamente');
        this.router.navigate(['/psychology/sessions', session.id]);
      })
    ),
    { dispatch: false }
  );

  updateSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.updateSession),
      switchMap(({ id, session }) =>
        this.psychologyApi.updateSession(id, session).pipe(
          map(updatedSession => PsychologyActions.updateSessionSuccess({ session: updatedSession })),
          catchError(error => of(PsychologyActions.updateSessionFailure({
            error: getApiErrorMessage(error, 'Error al actualizar sesion')
          })))
        )
      )
    )
  );

  updateSessionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.updateSessionSuccess),
      tap(() => {
        this.notification.showSuccess('Sesion actualizada correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.deleteSession),
      switchMap(({ id }) =>
        this.psychologyApi.deleteSession(id).pipe(
          map(() => PsychologyActions.deleteSessionSuccess({ id })),
          catchError(error => of(PsychologyActions.deleteSessionFailure({
            error: getApiErrorMessage(error, 'Error al eliminar sesion')
          })))
        )
      )
    )
  );

  deleteSessionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.deleteSessionSuccess),
      tap(() => {
        this.notification.showSuccess('Sesion eliminada correctamente');
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        PsychologyActions.loadEvaluationsFailure,
        PsychologyActions.loadEvaluationFailure,
        PsychologyActions.createEvaluationFailure,
        PsychologyActions.updateEvaluationFailure,
        PsychologyActions.deleteEvaluationFailure,
        PsychologyActions.loadSessionsFailure,
        PsychologyActions.loadSessionFailure,
        PsychologyActions.createSessionFailure,
        PsychologyActions.updateSessionFailure,
        PsychologyActions.deleteSessionFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}

