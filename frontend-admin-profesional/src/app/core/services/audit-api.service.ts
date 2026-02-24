import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuditFilter, AuditLog, ComplianceReport, EntityHistory, UserActivity } from '../../models/report.model';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

interface PaginatedResponse<T> {
  items?: T[];
  total?: number;
}

type LogsResponse = PaginatedResponse<AuditLog> | AuditLog[];

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private apiClient = inject(ApiClientService);

  listLogs(filter: AuditFilter): Observable<{ logs: AuditLog[]; total: number }> {
    return this.apiClient
      .get<LogsResponse>(API_ENDPOINTS.audit.logs, { ...filter })
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return { logs: response, total: response.length };
          }

          const logs = response?.items ?? [];
          const total = response?.total ?? logs.length;
          return { logs, total };
        })
      );
  }

  getEntityHistory(entityType: string, entityId: number): Observable<EntityHistory> {
    return this.apiClient.get<EntityHistory>(API_ENDPOINTS.audit.entityHistory(entityType, entityId));
  }

  getUserActivity(userId: number): Observable<UserActivity> {
    return this.apiClient.get<UserActivity>(API_ENDPOINTS.audit.userActivity(userId));
  }

  getComplianceReport(startDate: string, endDate: string): Observable<ComplianceReport> {
    return this.apiClient.get<ComplianceReport>(API_ENDPOINTS.audit.complianceReport, {
      start_date: startDate,
      end_date: endDate
    });
  }
}
