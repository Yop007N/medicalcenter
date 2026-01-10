import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Payment } from '../../models/budget.model';
import { NotificationService } from '../../core/services';
import * as PaymentsActions from './payments.actions';

@Injectable()
export class PaymentsEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loadPayments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadPayments),
      switchMap(({ budgetId }) => {
        let params = new HttpParams();
        if (budgetId) params = params.set('budget_id', budgetId.toString());

        return this.http.get<Payment[]>(`${environment.apiUrl}/payments`, { params }).pipe(
          map(payments => PaymentsActions.loadPaymentsSuccess({ payments })),
          catchError(error => of(PaymentsActions.loadPaymentsFailure({
            error: error.error?.msg || 'Error al cargar pagos'
          })))
        );
      })
    )
  );

  loadPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadPayment),
      switchMap(({ id }) =>
        this.http.get<Payment>(`${environment.apiUrl}/payments/${id}`).pipe(
          map(payment => PaymentsActions.loadPaymentSuccess({ payment })),
          catchError(error => of(PaymentsActions.loadPaymentFailure({
            error: error.error?.msg || 'Error al cargar pago'
          })))
        )
      )
    )
  );

  createPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.createPayment),
      switchMap(({ payment }) =>
        this.http.post<Payment>(`${environment.apiUrl}/payments`, payment).pipe(
          map(newPayment => PaymentsActions.createPaymentSuccess({ payment: newPayment })),
          catchError(error => of(PaymentsActions.createPaymentFailure({
            error: error.error?.msg || 'Error al registrar pago'
          })))
        )
      )
    )
  );

  createPaymentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.createPaymentSuccess),
      tap(({ payment }) => {
        this.notification.showSuccess('Pago registrado correctamente');
        this.router.navigate(['/payments', payment.id]);
      })
    ),
    { dispatch: false }
  );

  updatePayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.updatePayment),
      switchMap(({ id, payment }) =>
        this.http.put<Payment>(`${environment.apiUrl}/payments/${id}`, payment).pipe(
          map(updatedPayment => PaymentsActions.updatePaymentSuccess({ payment: updatedPayment })),
          catchError(error => of(PaymentsActions.updatePaymentFailure({
            error: error.error?.msg || 'Error al actualizar pago'
          })))
        )
      )
    )
  );

  updatePaymentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.updatePaymentSuccess),
      tap(() => {
        this.notification.showSuccess('Pago actualizado correctamente');
      })
    ),
    { dispatch: false }
  );

  deletePayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.deletePayment),
      switchMap(({ id }) =>
        this.http.delete(`${environment.apiUrl}/payments/${id}`).pipe(
          map(() => PaymentsActions.deletePaymentSuccess({ id })),
          catchError(error => of(PaymentsActions.deletePaymentFailure({
            error: error.error?.msg || 'Error al eliminar pago'
          })))
        )
      )
    )
  );

  deletePaymentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.deletePaymentSuccess),
      tap(() => {
        this.notification.showSuccess('Pago eliminado correctamente');
        this.router.navigate(['/payments']);
      })
    ),
    { dispatch: false }
  );

  processPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.processPayment),
      switchMap(({ id }) =>
        this.http.post<Payment>(`${environment.apiUrl}/payments/${id}/process`, {}).pipe(
          map(payment => PaymentsActions.processPaymentSuccess({ payment })),
          catchError(error => of(PaymentsActions.processPaymentFailure({
            error: error.error?.msg || 'Error al procesar pago'
          })))
        )
      )
    )
  );

  processPaymentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.processPaymentSuccess),
      tap(() => {
        this.notification.showSuccess('Pago procesado correctamente');
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
