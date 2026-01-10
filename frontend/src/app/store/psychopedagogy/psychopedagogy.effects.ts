import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PsychopedagogicalEvaluation, InterventionSession } from '../../models/psychopedagogy.model';
import { NotificationService } from '../../core/services';
import * as PsychopedagogyActions from './psychopedagogy.actions';

@Injectable()
export class PsychopedagogyEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadEvaluations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.loadEvaluations),
      switchMap(({ patientId }) => {
        let params = new HttpParams();
        if (patientId) params = params.set('patient_id', patientId.toString());

        return this.http.get<PsychopedagogicalEvaluation[]>(`${environment.apiUrl}/psychopedagogy/evaluations`, { params }).pipe(
          map(evaluations => PsychopedagogyActions.loadEvaluationsSuccess({ evaluations })),
          catchError(error => of(PsychopedagogyActions.loadEvaluationsFailure({
            error: error.error?.msg || 'Error al cargar evaluaciones'
          })))
        );
      })
    )
  );

  loadEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.loadEvaluation),
      switchMap(({ id }) =>
        this.http.get<PsychopedagogicalEvaluation>(`${environment.apiUrl}/psychopedagogy/evaluations/${id}`).pipe(
          map(evaluation => PsychopedagogyActions.loadEvaluationSuccess({ evaluation })),
          catchError(error => of(PsychopedagogyActions.loadEvaluationFailure({
            error: error.error?.msg || 'Error al cargar evaluación'
          })))
        )
      )
    )
  );

  createEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.createEvaluation),
      switchMap(({ evaluation }) =>
        this.http.post<PsychopedagogicalEvaluation>(`${environment.apiUrl}/psychopedagogy/evaluations`, evaluation).pipe(
          map(newEvaluation => PsychopedagogyActions.createEvaluationSuccess({ evaluation: newEvaluation })),
          catchError(error => of(PsychopedagogyActions.createEvaluationFailure({
            error: error.error?.msg || 'Error al crear evaluación'
          })))
        )
      )
    )
  );

  createEvaluationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.createEvaluationSuccess),
      tap(({ evaluation }) => {
        this.notification.showSuccess('Evaluación psicopedagógica creada correctamente');
        this.router.navigate(['/psychopedagogy/evaluations', evaluation.id]);
      })
    ),
    { dispatch: false }
  );

  updateEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.updateEvaluation),
      switchMap(({ id, evaluation }) =>
        this.http.put<PsychopedagogicalEvaluation>(`${environment.apiUrl}/psychopedagogy/evaluations/${id}`, evaluation).pipe(
          map(updatedEvaluation => PsychopedagogyActions.updateEvaluationSuccess({ evaluation: updatedEvaluation })),
          catchError(error => of(PsychopedagogyActions.updateEvaluationFailure({
            error: error.error?.msg || 'Error al actualizar evaluación'
          })))
        )
      )
    )
  );

  updateEvaluationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.updateEvaluationSuccess),
      tap(() => {
        this.notification.showSuccess('Evaluación actualizada correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.deleteEvaluation),
      switchMap(({ id }) =>
        this.http.delete(`${environment.apiUrl}/psychopedagogy/evaluations/${id}`).pipe(
          map(() => PsychopedagogyActions.deleteEvaluationSuccess({ id })),
          catchError(error => of(PsychopedagogyActions.deleteEvaluationFailure({
            error: error.error?.msg || 'Error al eliminar evaluación'
          })))
        )
      )
    )
  );

  deleteEvaluationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.deleteEvaluationSuccess),
      tap(() => {
        this.notification.showSuccess('Evaluación eliminada correctamente');
        this.router.navigate(['/psychopedagogy/evaluations']);
      })
    ),
    { dispatch: false }
  );

  loadSessions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.loadSessions),
      switchMap(({ evaluationId }) =>
        this.http.get<InterventionSession[]>(`${environment.apiUrl}/psychopedagogy/evaluations/${evaluationId}/sessions`).pipe(
          map(sessions => PsychopedagogyActions.loadSessionsSuccess({ sessions })),
          catchError(error => of(PsychopedagogyActions.loadSessionsFailure({
            error: error.error?.msg || 'Error al cargar sesiones'
          })))
        )
      )
    )
  );

  loadSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.loadSession),
      switchMap(({ id }) =>
        this.http.get<InterventionSession>(`${environment.apiUrl}/psychopedagogy/sessions/${id}`).pipe(
          map(session => PsychopedagogyActions.loadSessionSuccess({ session })),
          catchError(error => of(PsychopedagogyActions.loadSessionFailure({
            error: error.error?.msg || 'Error al cargar sesión'
          })))
        )
      )
    )
  );

  createSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.createSession),
      switchMap(({ session }) =>
        this.http.post<InterventionSession>(`${environment.apiUrl}/psychopedagogy/sessions`, session).pipe(
          map(newSession => PsychopedagogyActions.createSessionSuccess({ session: newSession })),
          catchError(error => of(PsychopedagogyActions.createSessionFailure({
            error: error.error?.msg || 'Error al crear sesión'
          })))
        )
      )
    )
  );

  createSessionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.createSessionSuccess),
      tap(({ session }) => {
        this.notification.showSuccess('Sesión de intervención registrada correctamente');
        this.router.navigate(['/psychopedagogy/sessions', session.id]);
      })
    ),
    { dispatch: false }
  );

  updateSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.updateSession),
      switchMap(({ id, session }) =>
        this.http.put<InterventionSession>(`${environment.apiUrl}/psychopedagogy/sessions/${id}`, session).pipe(
          map(updatedSession => PsychopedagogyActions.updateSessionSuccess({ session: updatedSession })),
          catchError(error => of(PsychopedagogyActions.updateSessionFailure({
            error: error.error?.msg || 'Error al actualizar sesión'
          })))
        )
      )
    )
  );

  updateSessionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.updateSessionSuccess),
      tap(() => {
        this.notification.showSuccess('Sesión actualizada correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.deleteSession),
      switchMap(({ id }) =>
        this.http.delete(`${environment.apiUrl}/psychopedagogy/sessions/${id}`).pipe(
          map(() => PsychopedagogyActions.deleteSessionSuccess({ id })),
          catchError(error => of(PsychopedagogyActions.deleteSessionFailure({
            error: error.error?.msg || 'Error al eliminar sesión'
          })))
        )
      )
    )
  );

  deleteSessionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychopedagogyActions.deleteSessionSuccess),
      tap(() => {
        this.notification.showSuccess('Sesión eliminada correctamente');
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        PsychopedagogyActions.loadEvaluationsFailure,
        PsychopedagogyActions.loadEvaluationFailure,
        PsychopedagogyActions.createEvaluationFailure,
        PsychopedagogyActions.updateEvaluationFailure,
        PsychopedagogyActions.deleteEvaluationFailure,
        PsychopedagogyActions.loadSessionsFailure,
        PsychopedagogyActions.loadSessionFailure,
        PsychopedagogyActions.createSessionFailure,
        PsychopedagogyActions.updateSessionFailure,
        PsychopedagogyActions.deleteSessionFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
