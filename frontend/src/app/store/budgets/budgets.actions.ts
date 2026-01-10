import { createAction, props } from '@ngrx/store';
import { Budget, BudgetCreate } from '../../models/budget.model';

// Load Budgets
export const loadBudgets = createAction(
  '[Budgets] Load Budgets',
  props<{ patientId?: number }>()
);
export const loadBudgetsSuccess = createAction(
  '[Budgets] Load Budgets Success',
  props<{ budgets: Budget[] }>()
);
export const loadBudgetsFailure = createAction(
  '[Budgets] Load Budgets Failure',
  props<{ error: string }>()
);

// Load Single Budget
export const loadBudget = createAction(
  '[Budgets] Load Budget',
  props<{ id: number }>()
);
export const loadBudgetSuccess = createAction(
  '[Budgets] Load Budget Success',
  props<{ budget: Budget }>()
);
export const loadBudgetFailure = createAction(
  '[Budgets] Load Budget Failure',
  props<{ error: string }>()
);

// Create Budget
export const createBudget = createAction(
  '[Budgets] Create Budget',
  props<{ budget: BudgetCreate }>()
);
export const createBudgetSuccess = createAction(
  '[Budgets] Create Budget Success',
  props<{ budget: Budget }>()
);
export const createBudgetFailure = createAction(
  '[Budgets] Create Budget Failure',
  props<{ error: string }>()
);

// Update Budget
export const updateBudget = createAction(
  '[Budgets] Update Budget',
  props<{ id: number; budget: Partial<BudgetCreate> }>()
);
export const updateBudgetSuccess = createAction(
  '[Budgets] Update Budget Success',
  props<{ budget: Budget }>()
);
export const updateBudgetFailure = createAction(
  '[Budgets] Update Budget Failure',
  props<{ error: string }>()
);

// Delete Budget
export const deleteBudget = createAction(
  '[Budgets] Delete Budget',
  props<{ id: number }>()
);
export const deleteBudgetSuccess = createAction(
  '[Budgets] Delete Budget Success',
  props<{ id: number }>()
);
export const deleteBudgetFailure = createAction(
  '[Budgets] Delete Budget Failure',
  props<{ error: string }>()
);

// Send Budget
export const sendBudget = createAction(
  '[Budgets] Send Budget',
  props<{ id: number }>()
);
export const sendBudgetSuccess = createAction(
  '[Budgets] Send Budget Success',
  props<{ budget: Budget }>()
);
export const sendBudgetFailure = createAction(
  '[Budgets] Send Budget Failure',
  props<{ error: string }>()
);

// Accept Budget
export const acceptBudget = createAction(
  '[Budgets] Accept Budget',
  props<{ id: number }>()
);
export const acceptBudgetSuccess = createAction(
  '[Budgets] Accept Budget Success',
  props<{ budget: Budget }>()
);
export const acceptBudgetFailure = createAction(
  '[Budgets] Accept Budget Failure',
  props<{ error: string }>()
);

// Clear
export const clearError = createAction('[Budgets] Clear Error');
export const clearSelectedBudget = createAction('[Budgets] Clear Selected Budget');
