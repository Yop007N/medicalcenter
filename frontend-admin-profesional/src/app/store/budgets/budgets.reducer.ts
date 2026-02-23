import { createReducer, on } from '@ngrx/store';
import { Budget } from '../../models/budget.model';
import * as BudgetsActions from './budgets.actions';
// Budget interface includes total_paid and payments_count

export interface BudgetsState {
  budgets: Budget[];
  selectedBudget: Budget | null;
  loading: boolean;
  error: string | null;
}

export const initialState: BudgetsState = {
  budgets: [],
  selectedBudget: null,
  loading: false,
  error: null
};

export const budgetsReducer = createReducer(
  initialState,

  // Load Budgets
  on(BudgetsActions.loadBudgets, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(BudgetsActions.loadBudgetsSuccess, (state, { budgets }) => ({
    ...state,
    budgets,
    loading: false
  })),
  on(BudgetsActions.loadBudgetsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Budget
  on(BudgetsActions.loadBudget, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(BudgetsActions.loadBudgetSuccess, (state, { budget }) => ({
    ...state,
    selectedBudget: budget,
    loading: false
  })),
  on(BudgetsActions.loadBudgetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Budget
  on(BudgetsActions.createBudget, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(BudgetsActions.createBudgetSuccess, (state, { budget }) => ({
    ...state,
    budgets: [budget, ...state.budgets],
    selectedBudget: budget,
    loading: false
  })),
  on(BudgetsActions.createBudgetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Budget
  on(BudgetsActions.updateBudget, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(BudgetsActions.updateBudgetSuccess, (state, { budget }) => ({
    ...state,
    budgets: state.budgets.map(b => b.id === budget.id ? budget : b),
    selectedBudget: budget,
    loading: false
  })),
  on(BudgetsActions.updateBudgetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Budget
  on(BudgetsActions.deleteBudget, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(BudgetsActions.deleteBudgetSuccess, (state, { id }) => ({
    ...state,
    budgets: state.budgets.filter(b => b.id !== id),
    selectedBudget: state.selectedBudget?.id === id ? null : state.selectedBudget,
    loading: false
  })),
  on(BudgetsActions.deleteBudgetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Send Budget
  on(BudgetsActions.sendBudget, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(BudgetsActions.sendBudgetSuccess, (state, { budget }) => ({
    ...state,
    budgets: state.budgets.map(b => b.id === budget.id ? budget : b),
    selectedBudget: budget,
    loading: false
  })),
  on(BudgetsActions.sendBudgetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Accept Budget
  on(BudgetsActions.acceptBudget, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(BudgetsActions.acceptBudgetSuccess, (state, { budget }) => ({
    ...state,
    budgets: state.budgets.map(b => b.id === budget.id ? budget : b),
    selectedBudget: budget,
    loading: false
  })),
  on(BudgetsActions.acceptBudgetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear
  on(BudgetsActions.clearError, state => ({
    ...state,
    error: null
  })),
  on(BudgetsActions.clearSelectedBudget, state => ({
    ...state,
    selectedBudget: null
  }))
);
