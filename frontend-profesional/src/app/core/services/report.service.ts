import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

export interface QuickStats {
  today_appointments: number;
  pending_budgets: number;
  new_patients_this_month: number;
  revenue_this_month: number;
}

export interface AppointmentStatusItem {
  status: string;
  count: number;
}

export interface AppointmentSummary {
  total_appointments: number;
  by_status: AppointmentStatusItem[];
  cancellation_rate: number;
  no_show_rate: number;
  period: {
    start: string;
    end: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private api: ApiService) {}

  getQuickStats(): Observable<QuickStats> {
    return this.api.get<QuickStats>(API_ENDPOINTS.reports.quickStats);
  }

  getAppointmentsSummary(startDate: string, endDate: string): Observable<AppointmentSummary> {
    return this.api.get<AppointmentSummary>(API_ENDPOINTS.reports.appointments, {
      start_date: startDate,
      end_date: endDate
    });
  }
}
