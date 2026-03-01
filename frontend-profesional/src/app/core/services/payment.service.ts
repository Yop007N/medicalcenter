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

  getPayments(filters?: { budget_id?: number; patient_id?: number; status?: string; specialty_key?: string }): Observable<Payment[]> {
    return this.api
      .get<CollectionResponse<Payment>>(API_ENDPOINTS.payments.base, filters)
      .pipe(mapCollectionItems<Payment>());
  }

  getPaymentById(id: number, specialtyKey?: string): Observable<Payment> {
    return this.api.get<Payment>(
      API_ENDPOINTS.payments.byId(id),
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }

  createPayment(payment: Partial<Payment>, specialtyKey?: string): Observable<Payment> {
    return this.api.post<Payment>(
      API_ENDPOINTS.payments.base,
      payment,
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }

  updatePayment(id: number, payment: Partial<Payment>, specialtyKey?: string): Observable<Payment> {
    return this.api.put<Payment>(
      API_ENDPOINTS.payments.byId(id),
      payment,
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }

  deletePayment(id: number, specialtyKey?: string): Observable<void> {
    return this.api.delete<void>(
      API_ENDPOINTS.payments.byId(id),
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }

  processPayment(id: number, specialtyKey?: string): Observable<Payment> {
    return this.api.post<Payment>(
      API_ENDPOINTS.payments.process(id),
      {},
      specialtyKey ? { specialty_key: specialtyKey } : undefined,
    );
  }
}
