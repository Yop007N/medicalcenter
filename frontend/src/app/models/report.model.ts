// Report types
export type ReportType = 'medical' | 'financial' | 'appointments' | 'patients' | 'professionals';
export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportFilter {
  start_date?: string;
  end_date?: string;
  patient_id?: number;
  professional_id?: number;
  status?: string;
}

// Medical Reports
export interface MedicalReport {
  total_records: number;
  by_professional: {
    professional_id: number;
    name: string;
    records_count: number;
  }[];
  by_specialty: {
    specialty: string;
    count: number;
  }[];
  period: {
    start: string;
    end: string;
  };
}

// Financial Reports
export interface FinancialReport {
  total_revenue: number;
  total_pending: number;
  currency: string;
  by_payment_method: {
    method: string;
    amount: number;
    count: number;
  }[];
  by_month: {
    month: string;
    revenue: number;
    pending: number;
  }[];
  period: {
    start: string;
    end: string;
  };
}

// Appointments Reports
export interface AppointmentsReport {
  total_appointments: number;
  by_status: {
    status: string;
    count: number;
  }[];
  by_professional: {
    professional_id: number;
    name: string;
    appointments_count: number;
  }[];
  cancellation_rate: number;
  no_show_rate: number;
  period: {
    start: string;
    end: string;
  };
}

// Quick Stats
export interface QuickStats {
  today_appointments: number;
  pending_budgets: number;
  new_patients_this_month: number;
  revenue_this_month: number;
}

// Audit Log
export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface AuditFilter {
  user_id?: number;
  entity_type?: string;
  entity_id?: number;
  action?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface EntityHistory {
  entity_type: string;
  entity_id: number;
  history: AuditLog[];
}

export interface UserActivity {
  user_id: number;
  total_actions: number;
  actions_by_type: {
    action: string;
    count: number;
  }[];
  recent_activity: AuditLog[];
}

export interface ComplianceReport {
  period: {
    start: string;
    end: string;
  };
  total_logins: number;
  total_data_modifications: number;
  sensitive_data_access: number;
  failed_login_attempts: number;
  users_activity_summary: {
    user_id: number;
    name: string;
    total_actions: number;
  }[];
}
