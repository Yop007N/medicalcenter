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

export interface MedicalSummaryReport {
  total_records: number;
  by_specialty: Array<{
    specialty: string;
    count: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface FinancialSummaryReport {
  total_revenue: number;
  total_pending: number;
  currency: string;
  by_payment_method: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
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

  getMedicalSummary(startDate: string, endDate: string): Observable<MedicalSummaryReport> {
    return this.api.get<MedicalSummaryReport>(API_ENDPOINTS.reports.medical, {
      start_date: startDate,
      end_date: endDate
    });
  }

  getFinancialSummary(startDate: string, endDate: string): Observable<FinancialSummaryReport> {
    return this.api.get<FinancialSummaryReport>(API_ENDPOINTS.reports.financial, {
      start_date: startDate,
      end_date: endDate
    });
  }

  exportReport(
    reportType: 'appointments' | 'financial' | 'medical',
    startDate: string,
    endDate: string
  ): Observable<Blob> {
    return this.api.getBlob(API_ENDPOINTS.reports.export(reportType), {
      start_date: startDate,
      end_date: endDate
    });
  }
}
