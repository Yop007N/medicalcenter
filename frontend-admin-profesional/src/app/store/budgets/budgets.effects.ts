import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Budget } from '../../models/budget.model';
import { BudgetsApiService, NotificationService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as BudgetsActions from './budgets.actions';

const normalizeCurrency = (currency?: string | null): string => {
  const code = String(currency ?? 'PYG').trim().toUpperCase();
  return code === 'ARS' ? 'PYG' : code || 'PYG';
};

const normalizeBudget = (budget: Partial<Budget>): Budget => ({
  id: budget.id ?? 0,
  patient_id: budget.patient_id ?? 0,
  created_by: budget.created_by ?? 0,
  title: budget.title ?? '',
  total_amount: budget.total_amount ?? 0,
  currency: normalizeCurrency(budget.currency),
  status: budget.status ?? 'draft',
  total_paid: budget.total_paid ?? 0,
  payments_count: budget.payments_count ?? 0,
  created_at: budget.created_at ?? new Date().toISOString(),
  ...budget
});

@Injectable()
export class BudgetsEffects {
  private actions$ = inject(Actions);
  private budgetsApi = inject(BudgetsApiService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadBudgets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.loadBudgets),
      switchMap(({ patientId, specialtyKey }) =>
        this.budgetsApi.list(patientId, specialtyKey).pipe(
          map((budgets) => BudgetsActions.loadBudgetsSuccess({
            budgets: budgets.map((budget) => normalizeBudget(budget))
          })),
          catchError(error => of(BudgetsActions.loadBudgetsFailure({
            error: getApiErrorMessage(error, 'Error al cargar presupuestos')
          })))
        )
      )
    )
  );

  loadBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.loadBudget),
      switchMap(({ id }) =>
        this.budgetsApi.getById(id).pipe(
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
      switchMap(({ budget, navigationQueryParams }) =>
        this.budgetsApi.create(budget).pipe(
          map(newBudget => BudgetsActions.createBudgetSuccess({
            budget: normalizeBudget(newBudget),
            navigationQueryParams
          })),
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
      tap(({ budget, navigationQueryParams }) => {
        this.notification.showSuccess('Presupuesto creado correctamente');
        this.router.navigate(['/budgets', budget.id], { queryParams: navigationQueryParams });
      })
    ),
    { dispatch: false }
  );

  updateBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.updateBudget),
      switchMap(({ id, budget, navigationQueryParams }) =>
        this.budgetsApi.update(id, budget).pipe(
          map(updatedBudget => BudgetsActions.updateBudgetSuccess({
            budget: normalizeBudget(updatedBudget),
            navigationQueryParams
          })),
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
      tap(({ budget, navigationQueryParams }) => {
        this.notification.showSuccess('Presupuesto actualizado correctamente');
        this.router.navigate(['/budgets', budget.id], { queryParams: navigationQueryParams });
      })
    ),
    { dispatch: false }
  );

  deleteBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.deleteBudget),
      switchMap(({ id, navigationQueryParams }) =>
        this.budgetsApi.delete(id).pipe(
          map(() => BudgetsActions.deleteBudgetSuccess({ id, navigationQueryParams })),
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
      tap(({ navigationQueryParams }) => {
        this.notification.showSuccess('Presupuesto eliminado correctamente');
        this.router.navigate(['/budgets'], { queryParams: navigationQueryParams });
      })
    ),
    { dispatch: false }
  );

  sendBudget$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BudgetsActions.sendBudget),
      switchMap(({ id }) =>
        this.budgetsApi.send(id).pipe(
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
        this.budgetsApi.accept(id).pipe(
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
