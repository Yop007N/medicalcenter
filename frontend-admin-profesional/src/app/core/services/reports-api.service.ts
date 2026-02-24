import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AppointmentsReport,
  FinancialReport,
  MedicalReport,
  QuickStats,
  ReportFilter
} from '../../models/report.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private apiClient = inject(ApiClientService);

  getMedicalReport(filter: ReportFilter): Observable<MedicalReport> {
    return this.apiClient.get<MedicalReport>(API_ENDPOINTS.reports.medical, { ...filter });
  }

  getFinancialReport(filter: ReportFilter): Observable<FinancialReport> {
    return this.apiClient.get<FinancialReport>(API_ENDPOINTS.reports.financial, { ...filter });
  }

  getAppointmentsReport(filter: ReportFilter): Observable<AppointmentsReport> {
    return this.apiClient.get<AppointmentsReport>(API_ENDPOINTS.reports.appointments, { ...filter });
  }

  getQuickStats(): Observable<QuickStats> {
    return this.apiClient.get<QuickStats>(API_ENDPOINTS.reports.quickStats);
  }

  exportReport(reportType: string, format: string, filter: ReportFilter): Observable<Blob> {
    return this.apiClient.getBlob(API_ENDPOINTS.reports.export(reportType), {
      format,
      ...filter
    });
  }
}
