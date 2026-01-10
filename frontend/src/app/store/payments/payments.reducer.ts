import { createReducer, on } from '@ngrx/store';
import { Payment } from '../../models/budget.model';
import * as PaymentsActions from './payments.actions';

export interface PaymentsState {
  payments: Payment[];
  selectedPayment: Payment | null;
  loading: boolean;
  error: string | null;
}

export const initialState: PaymentsState = {
  payments: [],
  selectedPayment: null,
  loading: false,
  error: null
};

export const paymentsReducer = createReducer(
  initialState,

  // Load Payments
  on(PaymentsActions.loadPayments, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PaymentsActions.loadPaymentsSuccess, (state, { payments }) => ({
    ...state,
    payments,
    loading: false
  })),
  on(PaymentsActions.loadPaymentsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Payment
  on(PaymentsActions.loadPayment, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PaymentsActions.loadPaymentSuccess, (state, { payment }) => ({
    ...state,
    selectedPayment: payment,
    loading: false
  })),
  on(PaymentsActions.loadPaymentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Payment
  on(PaymentsActions.createPayment, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PaymentsActions.createPaymentSuccess, (state, { payment }) => ({
    ...state,
    payments: [payment, ...state.payments],
    selectedPayment: payment,
    loading: false
  })),
  on(PaymentsActions.createPaymentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Payment
  on(PaymentsActions.updatePayment, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PaymentsActions.updatePaymentSuccess, (state, { payment }) => ({
    ...state,
    payments: state.payments.map(p => p.id === payment.id ? payment : p),
    selectedPayment: payment,
    loading: false
  })),
  on(PaymentsActions.updatePaymentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Payment
  on(PaymentsActions.deletePayment, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PaymentsActions.deletePaymentSuccess, (state, { id }) => ({
    ...state,
    payments: state.payments.filter(p => p.id !== id),
    selectedPayment: state.selectedPayment?.id === id ? null : state.selectedPayment,
    loading: false
  })),
  on(PaymentsActions.deletePaymentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Process Payment
  on(PaymentsActions.processPayment, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PaymentsActions.processPaymentSuccess, (state, { payment }) => ({
    ...state,
    payments: state.payments.map(p => p.id === payment.id ? payment : p),
    selectedPayment: payment,
    loading: false
  })),
  on(PaymentsActions.processPaymentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear
  on(PaymentsActions.clearError, state => ({
    ...state,
    error: null
  })),
  on(PaymentsActions.clearSelectedPayment, state => ({
    ...state,
    selectedPayment: null
  }))
);
