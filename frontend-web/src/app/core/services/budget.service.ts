import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Budget } from '../../shared/models/budget.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  constructor(private api: ApiService) {}

  getBudgets(filters?: any): Observable<Budget[]> {
    return this.api.get<Budget[]>('budgets', filters);
  }

  getBudgetById(id: number): Observable<Budget> {
    return this.api.get<Budget>(`budgets/${id}`);
  }

  createBudget(budget: Partial<Budget>): Observable<Budget> {
    return this.api.post<Budget>('budgets', budget);
  }

  updateBudget(id: number, budget: Partial<Budget>): Observable<Budget> {
    return this.api.put<Budget>(`budgets/${id}`, budget);
  }

  deleteBudget(id: number): Observable<void> {
    return this.api.delete<void>(`budgets/${id}`);
  }

  sendBudget(id: number): Observable<Budget> {
    return this.api.post<Budget>(`budgets/${id}/send`, {});
  }

  acceptBudget(id: number): Observable<Budget> {
    return this.api.post<Budget>(`budgets/${id}/accept`, {});
  }
}
