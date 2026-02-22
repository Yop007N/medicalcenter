import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Budget } from '../../models/budget.model';
import { NotificationService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import { CollectionResponse, toItemsArray } from '../pagination.adapter';
import * as BudgetsActions from './budgets.actions';

const normalizeBudget = (budget: Partial<Budget>): Budget => ({
  id: budget.id ?? 0,
  patient_id: budget.patient_id ?? 0,
  created_by: budget.created_by ?? 0,
  title: budget.title ?? '',
  total_amount: budget.total_amount ?? 0,
  currency: budget.currency ?? 'ARS',
  status: budget.status ?? 'draft',
  total_paid: budget.total_paid ?? 0,
  payments_count: budget.payments_count ?? 0,
  created_at: budget.created_at ?? new Date().toISOString(),
  ...budget
});

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

        return this.http.get<CollectionResponse<Budget>>(`${environment.apiUrl}/budgets`, { params }).pipe(
          map((response) => {
            const budgets = toItemsArray(response);
            return BudgetsActions.loadBudgetsSuccess({
              budgets: budgets.map((budget) => normalizeBudget(budget))
            });
          }),
          catchError(error => of(BudgetsActions.loadBudgetsFailure({
            error: getApiErrorMessage(error, 'Error al cargar presupuestos')
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
          map(budget => BudgetsActions.loadBudgetSuccess({ budget: normalizeBudget(budget) })),
          catchError(error => of(BudgetsActions.loadBudgetFailure({
            error: getApiErrorMessage(error, 'Error al cargar presupuesto')
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
          map(newBudget => BudgetsActions.createBudgetSuccess({ budget: normalizeBudget(newBudget) })),
          catchError(error => of(BudgetsActions.createBudgetFailure({
            error: getApiErrorMessage(error, 'Error al crear presupuesto')
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
          map(updatedBudget => BudgetsActions.updateBudgetSuccess({ budget: normalizeBudget(updatedBudget) })),
          catchError(error => of(BudgetsActions.updateBudgetFailure({
            error: getApiErrorMessage(error, 'Error al actualizar presupuesto')
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
            error: getApiErrorMessage(error, 'Error al eliminar presupuesto')
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
          map(budget => BudgetsActions.sendBudgetSuccess({ budget: normalizeBudget(budget) })),
          catchError(error => of(BudgetsActions.sendBudgetFailure({
            error: getApiErrorMessage(error, 'Error al enviar presupuesto')
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
          map(budget => BudgetsActions.acceptBudgetSuccess({ budget: normalizeBudget(budget) })),
          catchError(error => of(BudgetsActions.acceptBudgetFailure({
            error: getApiErrorMessage(error, 'Error al aceptar presupuesto')
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
