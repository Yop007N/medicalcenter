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
  psychology: {
    evaluationsBase: 'psychology/evaluations',
    evaluationById: (id: number) => `psychology/evaluations/${id}`,
    evaluationsByProfessional: (professionalId: number) =>
      `psychology/evaluations/professional/${professionalId}`,
    evaluationSessions: (evaluationId: number) => `psychology/evaluations/${evaluationId}/sessions`,
    sessionsBase: 'psychology/sessions',
    sessionById: (id: number) => `psychology/sessions/${id}`
  },
  psychopedagogy: {
    evaluationsBase: 'psychopedagogy/evaluations',
    evaluationById: (id: number) => `psychopedagogy/evaluations/${id}`,
    evaluationsByProfessional: (professionalId: number) =>
      `psychopedagogy/evaluations/professional/${professionalId}`,
    evaluationSessions: (evaluationId: number) => `psychopedagogy/evaluations/${evaluationId}/sessions`,
    sessionsBase: 'psychopedagogy/sessions',
    sessionById: (id: number) => `psychopedagogy/sessions/${id}`
  },
  odontology: {
    odontogramsBase: 'odontograms',
    odontogramById: (id: number) => `odontograms/${id}`,
    patientOdontogram: (patientId: number) => `odontograms/patient/${patientId}`,
    teethByOdontogram: (odontogramId: number) => `odontograms/${odontogramId}/teeth`,
    toothBaseByOdontogram: (odontogramId: number) => `odontograms/${odontogramId}/tooth`,
    toothByNumber: (odontogramId: number, toothNumber: number) =>
      `odontograms/${odontogramId}/teeth/${toothNumber}`,
    treatmentsBase: 'dental-treatments',
    treatmentById: (id: number) => `dental-treatments/${id}`,
    treatmentComplete: (id: number) => `dental-treatments/${id}/complete`,
    treatmentCancel: (id: number) => `dental-treatments/${id}/cancel`
  },
  reports: {
    quickStats: 'reports/quick/stats',
    medical: 'reports/medical',
    financial: 'reports/financial',
    appointments: 'reports/appointments',
    export: (reportType: 'appointments' | 'financial' | 'medical') => `reports/${reportType}/export`
  },
  files: {
    base: 'files',
    upload: 'files/upload',
    byId: (id: number) => `files/${id}`,
    download: (id: number) => `files/${id}/download`
  },
  specialties: {
    catalog: 'specialties/catalog',
    myModule: 'specialties/my-module',
    myModuleOverview: 'specialties/my-module/overview',
    history: 'specialties/history',
    encounters: 'specialties/encounters',
    encounterById: (id: number) => `specialties/encounters/${id}`
  }
} as const;
