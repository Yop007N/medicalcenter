import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
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
  generated_at: string;
}

export interface DashboardActivityItem {
  id: number;
  created_at: string;
}

export interface DashboardAppointmentActivity extends DashboardActivityItem {
  patient_id: number;
  professional_id: number;
  date: string;
  status: string;
}

export interface DashboardPaymentActivity extends DashboardActivityItem {
  amount: number;
  status: string;
  method: string;
}

export interface DashboardFileActivity extends DashboardActivityItem {
  filename: string;
  file_type: string;
  size_mb: number;
}

export interface DashboardRecentActivity {
  recent_appointments: DashboardAppointmentActivity[];
  recent_payments: DashboardPaymentActivity[];
  recent_files: DashboardFileActivity[];
  generated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private readonly api: ApiService) {}

  getOverview(): Observable<DashboardOverview> {
    return this.api.get<DashboardOverview>(API_ENDPOINTS.dashboard.overview);
  }

  getRecentActivity(): Observable<DashboardRecentActivity> {
    return this.api.get<DashboardRecentActivity>(API_ENDPOINTS.dashboard.recentActivity);
  }
}
