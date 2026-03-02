import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { map, catchError, switchMap, tap, mergeMap } from 'rxjs/operators';
import { Payment } from '../../models/budget.model';
import { NotificationService, PaymentsApiService } from '../../core/services';
import { getApiErrorMessage } from '../error.adapter';
import * as PaymentsActions from './payments.actions';

const normalizeCurrency = (currency?: string | null): string => {
  const code = String(currency ?? 'PYG').trim().toUpperCase();
  return code === 'ARS' ? 'PYG' : code || 'PYG';
};

const normalizePayment = (payment: Partial<Payment>): Payment => ({
  id: payment.id ?? 0,
  amount: payment.amount ?? 0,
  currency: normalizeCurrency(payment.currency),
  payment_status: payment.payment_status ?? 'pending',
  payment_method: payment.payment_method ?? 'cash',
  transaction_id: payment.transaction_id,
  transaction_reference: payment.transaction_reference ?? payment.transaction_id,
  payment_date: payment.payment_date,
  created_at: payment.created_at ?? new Date().toISOString(),
  ...payment
});

@Injectable()
export class PaymentsEffects {
  private actions$ = inject(Actions);
  private paymentsApi = inject(PaymentsApiService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadPayments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadPayments),
      switchMap(({ budgetId, patientId, specialtyKey }) =>
        this.paymentsApi.list(budgetId, patientId, specialtyKey).pipe(
          map((payments) => PaymentsActions.loadPaymentsSuccess({
            payments: payments.map((payment) => normalizePayment(payment))
          })),
          catchError(error => of(PaymentsActions.loadPaymentsFailure({
            error: getApiErrorMessage(error, 'Error al cargar pagos')
          })))
        )
      )
    )
  );

  loadPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadPayment),
      switchMap(({ id }) =>
        this.paymentsApi.getById(id).pipe(
          map(payment => PaymentsActions.loadPaymentSuccess({ payment: normalizePayment(payment) })),
          catchError(error => of(PaymentsActions.loadPaymentFailure({
            error: getApiErrorMessage(error, 'Error al cargar pago')
          })))
        )
      )
    )
  );

  createPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.createPayment),
      switchMap(({ payment, autoProcessOnCreate, navigateToBudgetOnSuccess, navigationQueryParams }) =>
        this.paymentsApi.create(payment).pipe(
          map(newPayment => PaymentsActions.createPaymentSuccess({
            payment: normalizePayment(newPayment),
            autoProcessOnCreate,
            navigateToBudgetOnSuccess,
            navigationQueryParams
          })),
          catchError(error => of(PaymentsActions.createPaymentFailure({
            error: getApiErrorMessage(error, 'Error al registrar pago')
          })))
        )
      )
    )
  );

  createPaymentAutoProcess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.createPaymentSuccess),
      mergeMap(({ payment, autoProcessOnCreate, navigateToBudgetOnSuccess, navigationQueryParams }) => {
        if (!autoProcessOnCreate) {
          return EMPTY;
        }

        return of(PaymentsActions.processPayment({
          id: payment.id,
          budgetId: payment.budget_id,
          redirectToBudget: navigateToBudgetOnSuccess !== false,
          silentSuccess: true,
          navigationQueryParams
        }));
      })
    )
  );

  createPaymentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.createPaymentSuccess),
      tap(({ payment, autoProcessOnCreate, navigationQueryParams }) => {
        if (autoProcessOnCreate) {
          return;
        }
        this.notification.showSuccess('Pago registrado correctamente');
        this.router.navigate(['/payments', payment.id], { queryParams: navigationQueryParams });
      })
    ),
    { dispatch: false }
  );

  updatePayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.updatePayment),
      switchMap(({ id, payment, navigationQueryParams }) =>
        this.paymentsApi.update(id, payment).pipe(
          map(updatedPayment => PaymentsActions.updatePaymentSuccess({
            payment: normalizePayment(updatedPayment),
            navigationQueryParams
          })),
          catchError(error => of(PaymentsActions.updatePaymentFailure({
            error: getApiErrorMessage(error, 'Error al actualizar pago')
          })))
        )
      )
    )
  );

  updatePaymentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.updatePaymentSuccess),
      tap(({ payment, navigationQueryParams }) => {
        this.notification.showSuccess('Pago actualizado correctamente');
        this.router.navigate(['/payments', payment.id], { queryParams: navigationQueryParams });
      })
    ),
    { dispatch: false }
  );

  deletePayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.deletePayment),
      switchMap(({ id, navigationQueryParams }) =>
        this.paymentsApi.delete(id).pipe(
          map(() => PaymentsActions.deletePaymentSuccess({ id, navigationQueryParams })),
          catchError(error => of(PaymentsActions.deletePaymentFailure({
            error: getApiErrorMessage(error, 'Error al eliminar pago')
          })))
        )
      )
    )
  );

  deletePaymentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.deletePaymentSuccess),
      tap(({ navigationQueryParams }) => {
        this.notification.showSuccess('Pago eliminado correctamente');
        this.router.navigate(['/payments'], { queryParams: navigationQueryParams });
      })
    ),
    { dispatch: false }
  );

  processPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.processPayment),
      switchMap(({ id, budgetId, redirectToBudget, silentSuccess, navigationQueryParams }) =>
        this.paymentsApi.process(id).pipe(
          map(payment => PaymentsActions.processPaymentSuccess({
            payment: normalizePayment(payment),
            budgetId,
            redirectToBudget,
            silentSuccess,
            navigationQueryParams
          })),
          catchError(error => of(PaymentsActions.processPaymentFailure({
            error: getApiErrorMessage(error, 'Error al procesar pago')
          })))
        )
      )
    )
  );

  processPaymentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.processPaymentSuccess),
      tap(({ payment, budgetId, redirectToBudget, silentSuccess, navigationQueryParams }) => {
        this.notification.showSuccess(
          silentSuccess ? 'Pago registrado y completado correctamente' : 'Pago procesado correctamente'
        );

        const targetBudgetId = budgetId ?? payment.budget_id;
        if (redirectToBudget && targetBudgetId) {
          this.router.navigate(['/budgets', targetBudgetId], { queryParams: navigationQueryParams });
        }
      })
    ),
    { dispatch: false }
  );

  handleError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        PaymentsActions.loadPaymentsFailure,
        PaymentsActions.loadPaymentFailure,
        PaymentsActions.createPaymentFailure,
        PaymentsActions.updatePaymentFailure,
        PaymentsActions.deletePaymentFailure,
        PaymentsActions.processPaymentFailure
      ),
      tap(({ error }) => {
        this.notification.showError(error);
      })
    ),
    { dispatch: false }
  );
}
