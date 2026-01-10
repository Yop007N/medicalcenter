import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Budget } from '../../models/budget.model';
import { NotificationService } from '../../core/services';
import * as BudgetsActions from './budgets.actions';

@Injectable()
export class BudgetsEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadBudgets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.loadBudgets),
      switchMap(({ patientId }) => {
        let params = new HttpParams();
        if (patientId) params = params.set('patient_id', patientId.toString());

        return this.http.get<Budget[]>(`${environment.apiUrl}/budgets`, { params }).pipe(
          map(budgets => BudgetsActions.loadBudgetsSuccess({ budgets })),
          catchError(error => of(BudgetsActions.loadBudgetsFailure({
            error: error.error?.msg || 'Error al cargar presupuestos'
          })))
        );
      })
    )
  );

  loadBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.loadBudget),
      switchMap(({ id }) =>
        this.http.get<Budget>(`${environment.apiUrl}/budgets/${id}`).pipe(
          map(budget => BudgetsActions.loadBudgetSuccess({ budget })),
          catchError(error => of(BudgetsActions.loadBudgetFailure({
            error: error.error?.msg || 'Error al cargar presupuesto'
          })))
        )
      )
    )
  );

  createBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.createBudget),
      switchMap(({ budget }) =>
        this.http.post<Budget>(`${environment.apiUrl}/budgets`, budget).pipe(
          map(newBudget => BudgetsActions.createBudgetSuccess({ budget: newBudget })),
          catchError(error => of(BudgetsActions.createBudgetFailure({
            error: error.error?.msg || 'Error al crear presupuesto'
          })))
        )
      )
    )
  );

  createBudgetSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.createBudgetSuccess),
      tap(({ budget }) => {
        this.notification.showSuccess('Presupuesto creado correctamente');
        this.router.navigate(['/budgets', budget.id]);
      })
    ),
    { dispatch: false }
  );

  updateBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.updateBudget),
      switchMap(({ id, budget }) =>
        this.http.put<Budget>(`${environment.apiUrl}/budgets/${id}`, budget).pipe(
          map(updatedBudget => BudgetsActions.updateBudgetSuccess({ budget: updatedBudget })),
          catchError(error => of(BudgetsActions.updateBudgetFailure({
            error: error.error?.msg || 'Error al actualizar presupuesto'
          })))
        )
      )
    )
  );

  updateBudgetSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.updateBudgetSuccess),
      tap(({ budget }) => {
        this.notification.showSuccess('Presupuesto actualizado correctamente');
        this.router.navigate(['/budgets', budget.id]);
      })
    ),
    { dispatch: false }
  );

  deleteBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.deleteBudget),
      switchMap(({ id }) =>
        this.http.delete(`${environment.apiUrl}/budgets/${id}`).pipe(
          map(() => BudgetsActions.deleteBudgetSuccess({ id })),
          catchError(error => of(BudgetsActions.deleteBudgetFailure({
            error: error.error?.msg || 'Error al eliminar presupuesto'
          })))
        )
      )
    )
  );

  deleteBudgetSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.deleteBudgetSuccess),
      tap(() => {
        this.notification.showSuccess('Presupuesto eliminado correctamente');
        this.router.navigate(['/budgets']);
      })
    ),
    { dispatch: false }
  );

  sendBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.sendBudget),
      switchMap(({ id }) =>
        this.http.post<Budget>(`${environment.apiUrl}/budgets/${id}/send`, {}).pipe(
          map(budget => BudgetsActions.sendBudgetSuccess({ budget })),
          catchError(error => of(BudgetsActions.sendBudgetFailure({
            error: error.error?.msg || 'Error al enviar presupuesto'
          })))
        )
      )
    )
  );

  sendBudgetSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.sendBudgetSuccess),
      tap(() => {
        this.notification.showSuccess('Presupuesto enviado al paciente');
      })
    ),
    { dispatch: false }
  );

  acceptBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.acceptBudget),
      switchMap(({ id }) =>
        this.http.post<Budget>(`${environment.apiUrl}/budgets/${id}/accept`, {}).pipe(
          map(budget => BudgetsActions.acceptBudgetSuccess({ budget })),
          catchError(error => of(BudgetsActions.acceptBudgetFailure({
            error: error.error?.msg || 'Error al aceptar presupuesto'
          })))
        )
      )
    )
  );

  acceptBudgetSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.acceptBudgetSuccess),
      tap(() => {
        this.notification.showSuccess('Presupuesto aceptado');
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BudgetsActions.loadBudgetsFailure,
        BudgetsActions.loadBudgetFailure,
        BudgetsActions.createBudgetFailure,
        BudgetsActions.updateBudgetFailure,
        BudgetsActions.deleteBudgetFailure,
        BudgetsActions.sendBudgetFailure,
        BudgetsActions.acceptBudgetFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
