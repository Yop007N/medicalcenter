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

  getBudgetById(id: number, specialtyKey?: string): Observable<Budget> {
    return this.api.get<Budget>(
      API_ENDPOINTS.budgets.byId(id),
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }

  createBudget(budget: Partial<Budget>, specialtyKey?: string): Observable<Budget> {
    return this.api.post<Budget>(
      API_ENDPOINTS.budgets.base,
      budget,
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }

  updateBudget(id: number, budget: Partial<Budget>, specialtyKey?: string): Observable<Budget> {
    return this.api.put<Budget>(
      API_ENDPOINTS.budgets.byId(id),
      budget,
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }

  deleteBudget(id: number, specialtyKey?: string): Observable<void> {
    return this.api.delete<void>(
      API_ENDPOINTS.budgets.byId(id),
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }

  sendBudget(id: number, specialtyKey?: string): Observable<Budget> {
    return this.api.post<Budget>(
      API_ENDPOINTS.budgets.send(id),
      {},
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }

  acceptBudget(id: number, specialtyKey?: string): Observable<Budget> {
    return this.api.post<Budget>(
      API_ENDPOINTS.budgets.accept(id),
      {},
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }
}
