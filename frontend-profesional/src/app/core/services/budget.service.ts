import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Budget } from '../../shared/models/budget.model';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { CollectionResponse, mapCollectionItems } from '../api/collection-response.util';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  constructor(private api: ApiService) {}

  getBudgets(filters?: {
    patient_id?: number;
    status?: Budget['status'];
    specialty_key?: string;
  }): Observable<Budget[]> {
    return this.api
      .get<CollectionResponse<Budget>>(API_ENDPOINTS.budgets.base, filters)
      .pipe(mapCollectionItems<Budget>());
  }

  getBudgetById(id: number): Observable<Budget> {
    return this.api.get<Budget>(API_ENDPOINTS.budgets.byId(id));
  }

  createBudget(budget: Partial<Budget>): Observable<Budget> {
    return this.api.post<Budget>(API_ENDPOINTS.budgets.base, budget);
  }

  updateBudget(id: number, budget: Partial<Budget>): Observable<Budget> {
    return this.api.put<Budget>(API_ENDPOINTS.budgets.byId(id), budget);
  }

  deleteBudget(id: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.budgets.byId(id));
  }

  sendBudget(id: number): Observable<Budget> {
    return this.api.post<Budget>(API_ENDPOINTS.budgets.send(id), {});
  }

  acceptBudget(id: number): Observable<Budget> {
    return this.api.post<Budget>(API_ENDPOINTS.budgets.accept(id), {});
  }
}
