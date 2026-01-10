import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PsychologicalEvaluation, TherapySession } from '../../models/psychology.model';
import { NotificationService } from '../../core/services';
import * as PsychologyActions from './psychology.actions';

@Injectable()
export class PsychologyEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadEvaluations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.loadEvaluations),
      switchMap(({ patientId }) => {
        let params = new HttpParams();
        if (patientId) params = params.set('patient_id', patientId.toString());

        return this.http.get<PsychologicalEvaluation[]>(`${environment.apiUrl}/psychology/evaluations`, { params }).pipe(
          map(evaluations => PsychologyActions.loadEvaluationsSuccess({ evaluations })),
          catchError(error => of(PsychologyActions.loadEvaluationsFailure({
            error: error.error?.msg || 'Error al cargar evaluaciones'
          })))
        );
      })
    )
  );

  loadEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.loadEvaluation),
      switchMap(({ id }) =>
        this.http.get<PsychologicalEvaluation>(`${environment.apiUrl}/psychology/evaluations/${id}`).pipe(
          map(evaluation => PsychologyActions.loadEvaluationSuccess({ evaluation })),
          catchError(error => of(PsychologyActions.loadEvaluationFailure({
            error: error.error?.msg || 'Error al cargar evaluación'
          })))
        )
      )
    )
  );

  createEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.createEvaluation),
      switchMap(({ evaluation }) =>
        this.http.post<PsychologicalEvaluation>(`${environment.apiUrl}/psychology/evaluations`, evaluation).pipe(
          map(newEvaluation => PsychologyActions.createEvaluationSuccess({ evaluation: newEvaluation })),
          catchError(error => of(PsychologyActions.createEvaluationFailure({
            error: error.error?.msg || 'Error al crear evaluación'
          })))
        )
      )
    )
  );

  createEvaluationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.createEvaluationSuccess),
      tap(({ evaluation }) => {
        this.notification.showSuccess('Evaluación psicológica creada correctamente');
        this.router.navigate(['/psychology/evaluations', evaluation.id]);
      })
    ),
    { dispatch: false }
  );

  updateEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.updateEvaluation),
      switchMap(({ id, evaluation }) =>
        this.http.put<PsychologicalEvaluation>(`${environment.apiUrl}/psychology/evaluations/${id}`, evaluation).pipe(
          map(updatedEvaluation => PsychologyActions.updateEvaluationSuccess({ evaluation: updatedEvaluation })),
          catchError(error => of(PsychologyActions.updateEvaluationFailure({
            error: error.error?.msg || 'Error al actualizar evaluación'
          })))
        )
      )
    )
  );

  updateEvaluationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.updateEvaluationSuccess),
      tap(() => {
        this.notification.showSuccess('Evaluación actualizada correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.deleteEvaluation),
      switchMap(({ id }) =>
        this.http.delete(`${environment.apiUrl}/psychology/evaluations/${id}`).pipe(
          map(() => PsychologyActions.deleteEvaluationSuccess({ id })),
          catchError(error => of(PsychologyActions.deleteEvaluationFailure({
            error: error.error?.msg || 'Error al eliminar evaluación'
          })))
        )
      )
    )
  );

  deleteEvaluationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.deleteEvaluationSuccess),
      tap(() => {
        this.notification.showSuccess('Evaluación eliminada correctamente');
        this.router.navigate(['/psychology/evaluations']);
      })
    ),
    { dispatch: false }
  );

  loadSessions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.loadSessions),
      switchMap(({ evaluationId }) =>
        this.http.get<TherapySession[]>(`${environment.apiUrl}/psychology/evaluations/${evaluationId}/sessions`).pipe(
          map(sessions => PsychologyActions.loadSessionsSuccess({ sessions })),
          catchError(error => of(PsychologyActions.loadSessionsFailure({
            error: error.error?.msg || 'Error al cargar sesiones'
          })))
        )
      )
    )
  );

  loadSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.loadSession),
      switchMap(({ id }) =>
        this.http.get<TherapySession>(`${environment.apiUrl}/psychology/sessions/${id}`).pipe(
          map(session => PsychologyActions.loadSessionSuccess({ session })),
          catchError(error => of(PsychologyActions.loadSessionFailure({
            error: error.error?.msg || 'Error al cargar sesión'
          })))
        )
      )
    )
  );

  createSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.createSession),
      switchMap(({ session }) =>
        this.http.post<TherapySession>(`${environment.apiUrl}/psychology/sessions`, session).pipe(
          map(newSession => PsychologyActions.createSessionSuccess({ session: newSession })),
          catchError(error => of(PsychologyActions.createSessionFailure({
            error: error.error?.msg || 'Error al crear sesión'
          })))
        )
      )
    )
  );

  createSessionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.createSessionSuccess),
      tap(({ session }) => {
        this.notification.showSuccess('Sesión de terapia registrada correctamente');
        this.router.navigate(['/psychology/sessions', session.id]);
      })
    ),
    { dispatch: false }
  );

  updateSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.updateSession),
      switchMap(({ id, session }) =>
        this.http.put<TherapySession>(`${environment.apiUrl}/psychology/sessions/${id}`, session).pipe(
          map(updatedSession => PsychologyActions.updateSessionSuccess({ session: updatedSession })),
          catchError(error => of(PsychologyActions.updateSessionFailure({
            error: error.error?.msg || 'Error al actualizar sesión'
          })))
        )
      )
    )
  );

  updateSessionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.updateSessionSuccess),
      tap(() => {
        this.notification.showSuccess('Sesión actualizada correctamente');
      })
    ),
    { dispatch: false }
  );

  deleteSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.deleteSession),
      switchMap(({ id }) =>
        this.http.delete(`${environment.apiUrl}/psychology/sessions/${id}`).pipe(
          map(() => PsychologyActions.deleteSessionSuccess({ id })),
          catchError(error => of(PsychologyActions.deleteSessionFailure({
            error: error.error?.msg || 'Error al eliminar sesión'
          })))
        )
      )
    )
  );

  deleteSessionSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PsychologyActions.deleteSessionSuccess),
      tap(() => {
        this.notification.showSuccess('Sesión eliminada correctamente');
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
