import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { CollectionResponse, mapCollectionItems } from '../api/collection-response.util';

export interface Payment {
  id: number;
  budget_id?: number | null;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string | null;
  payment_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private api: ApiService) {}

  getPayments(filters?: { budget_id?: number; status?: string }): Observable<Payment[]> {
    return this.api
      .get<CollectionResponse<Payment>>(API_ENDPOINTS.payments.base, filters)
      .pipe(mapCollectionItems<Payment>());
  }

  getPaymentById(id: number): Observable<Payment> {
    return this.api.get<Payment>(API_ENDPOINTS.payments.byId(id));
  }

  createPayment(payment: Partial<Payment>): Observable<Payment> {
    return this.api.post<Payment>(API_ENDPOINTS.payments.base, payment);
  }

  updatePayment(id: number, payment: Partial<Payment>): Observable<Payment> {
    return this.api.put<Payment>(API_ENDPOINTS.payments.byId(id), payment);
  }

  deletePayment(id: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.payments.byId(id));
  }

  processPayment(id: number): Observable<Payment> {
    return this.api.post<Payment>(API_ENDPOINTS.payments.process(id), {});
  }
}
