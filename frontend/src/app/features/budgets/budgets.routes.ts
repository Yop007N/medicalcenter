import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { BudgetsEffects } from '../../store/budgets/budgets.effects';

export const BUDGETS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(BudgetsEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./budgets-list/budgets-list.page').then(m => m.BudgetsListPage)
      },
      {
        path: 'new',
        loadComponent: () => import('./budget-form/budget-form.page').then(m => m.BudgetFormPage)
      },
      {
        path: ':id',
        loadComponent: () => import('./budget-detail/budget-detail.page').then(m => m.BudgetDetailPage)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./budget-form/budget-form.page').then(m => m.BudgetFormPage)
      }
    ]
  }
];
