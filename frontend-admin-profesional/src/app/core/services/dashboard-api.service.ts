import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

export interface DashboardOverview {
  totals: {
    patients: number;
    professionals: number;
    appointments: number;
    medical_records: number;
    budgets: number;
    payments: number;
  };
  recent_activity: {
    new_patients_30d: number;
    appointments_30d: number;
  };
  appointment_status: Record<string, number>;
  revenue: {
    total: number;
    currency: string;
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private apiClient = inject(ApiClientService);

  getOverview(): Observable<DashboardOverview> {
    return this.apiClient.get<DashboardOverview>(API_ENDPOINTS.dashboard.overview);
  }
}
