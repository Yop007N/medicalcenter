import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BudgetsState } from './budgets.reducer';

export const selectBudgetsState = createFeatureSelector<BudgetsState>('budgets');

export const selectAllBudgets = createSelector(
  selectBudgetsState,
  state => state.budgets
);

export const selectSelectedBudget = createSelector(
  selectBudgetsState,
  state => state.selectedBudget
);

export const selectBudgetsLoading = createSelector(
  selectBudgetsState,
  state => state.loading
);

export const selectBudgetsError = createSelector(
  selectBudgetsState,
  state => state.error
);

export const selectBudgetsByStatus = (status: string) => createSelector(
  selectAllBudgets,
  budgets => budgets.filter(b => b.status === status)
);

export const selectBudgetsByPatient = (patientId: number) => createSelector(
  selectAllBudgets,
  budgets => budgets.filter(b => b.patient_id === patientId)
);
