export const API_ENDPOINTS = {
  auth: {
    login: 'auth/login',
    refresh: 'auth/refresh',
    logout: 'auth/logout'
  },
  dashboard: {
    overview: 'dashboard/overview',
    appointmentStats: 'dashboard/appointments/stats',
    revenueStats: 'dashboard/revenue/stats',
    patientStats: 'dashboard/patients/stats',
    filesStats: 'dashboard/files/stats',
    recentActivity: 'dashboard/activity/recent'
  },
  appointments: {
    base: 'appointments',
    byId: (id: number) => `appointments/${id}`,
    confirm: (id: number) => `appointments/${id}/confirm`
  },
  budgets: {
    base: 'budgets',
    byId: (id: number) => `budgets/${id}`,
    send: (id: number) => `budgets/${id}/send`,
    accept: (id: number) => `budgets/${id}/accept`
  },
  payments: {
    base: 'payments',
    byId: (id: number) => `payments/${id}`,
    process: (id: number) => `payments/${id}/process`
  },
  patients: {
    base: 'patients',
    byId: (id: number) => `patients/${id}`
  },
  professionals: {
    base: 'professionals',
    byId: (id: number) => `professionals/${id}`
  },
  medicalRecords: {
    base: 'medical-records',
    byId: (id: number) => `medical-records/${id}`
  },
  reports: {
    quickStats: 'reports/quick/stats',
    medical: 'reports/medical',
    financial: 'reports/financial',
    appointments: 'reports/appointments'
  },
  files: {
    upload: 'files/upload',
    byId: (id: number) => `files/${id}`,
    download: (id: number) => `files/${id}/download`
  }
} as const;
