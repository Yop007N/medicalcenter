export const API_ENDPOINTS = {
  auth: {
    login: 'auth/login',
    register: 'auth/register',
    refresh: 'auth/refresh',
    logout: 'auth/logout'
  },
  appointments: {
    base: 'appointments',
    byId: (id: number) => `appointments/${id}`,
    confirm: (id: number) => `appointments/${id}/confirm`
  },
  patients: {
    base: 'patients',
    byId: (id: number) => `patients/${id}`,
    appointments: (id: number) => `patients/${id}/appointments`,
    medicalRecords: (id: number) => `patients/${id}/medical-records`,
    budgets: (id: number) => `patients/${id}/budgets`
  },
  professionals: {
    base: 'professionals',
    byId: (id: number) => `professionals/${id}`,
    appointments: (id: number) => `professionals/${id}/appointments`
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
  files: {
    base: 'files',
    byId: (id: number) => `files/${id}`,
    upload: 'files/upload',
    download: (id: number) => `files/${id}/download`
  },
  reports: {
    medical: 'reports/medical',
    financial: 'reports/financial',
    appointments: 'reports/appointments',
    quickStats: 'reports/quick/stats',
    export: (reportType: string) => `reports/${reportType}/export`
  },
  psychology: {
    evaluationsBase: 'psychology/evaluations',
    evaluationById: (id: number) => `psychology/evaluations/${id}`,
    evaluationsByPatient: (patientId: number) => `psychology/evaluations/patient/${patientId}`,
    evaluationsByProfessional: (professionalId: number) =>
      `psychology/evaluations/professional/${professionalId}`,
    evaluationSessions: (evaluationId: number) => `psychology/evaluations/${evaluationId}/sessions`,
    sessionsBase: 'psychology/sessions',
    sessionById: (id: number) => `psychology/sessions/${id}`,
    sessionsByPatientHistory: (patientId: number) => `psychology/sessions/patient/${patientId}/history`
  },
  psychopedagogy: {
    evaluationsBase: 'psychopedagogy/evaluations',
    evaluationById: (id: number) => `psychopedagogy/evaluations/${id}`,
    evaluationsByPatient: (patientId: number) => `psychopedagogy/evaluations/patient/${patientId}`,
    evaluationsByProfessional: (professionalId: number) =>
      `psychopedagogy/evaluations/professional/${professionalId}`,
    evaluationSessions: (evaluationId: number) => `psychopedagogy/evaluations/${evaluationId}/sessions`,
    sessionsBase: 'psychopedagogy/sessions',
    sessionById: (id: number) => `psychopedagogy/sessions/${id}`,
    sessionsByPatientHistory: (patientId: number) => `psychopedagogy/sessions/patient/${patientId}/history`
  },
  audit: {
    logs: 'audit/logs',
    entityHistory: (entityType: string, entityId: number) => `audit/entity/${entityType}/${entityId}/history`,
    userActivity: (userId: number) => `audit/user/${userId}/activity`,
    complianceReport: 'audit/compliance/report'
  },
  odontology: {
    odontogramsBase: 'odontograms',
    odontogramById: (id: number) => `odontograms/${id}`,
    patientOdontogram: (patientId: number) => `odontograms/patient/${patientId}`,
    teethByOdontogram: (odontogramId: number) => `odontograms/${odontogramId}/teeth`,
    toothBaseByOdontogram: (odontogramId: number) => `odontograms/${odontogramId}/tooth`,
    toothByOdontogramAndNumber: (odontogramId: number, toothNumber: number) => `odontograms/${odontogramId}/tooth/${toothNumber}`,
    toothByNumber: (odontogramId: number, toothNumber: number) => `odontograms/${odontogramId}/teeth/${toothNumber}`,
    treatmentsBase: 'dental-treatments',
    treatmentById: (id: number) => `dental-treatments/${id}`
  },
  medicalRecords: {
    base: 'medical-records',
    byId: (id: number) => `medical-records/${id}`
  },
  clinicalHistory: {
    evolutions: 'clinical-history/evolutions',
    evolutionById: (id: number) => `clinical-history/evolutions/${id}`,
    evolutionSign: (id: number) => `clinical-history/evolutions/${id}/sign`,
    evolutionAnnul: (id: number) => `clinical-history/evolutions/${id}/annul`,
    anamnesis: 'clinical-history/anamnesis',
    anamnesisByPatient: (patientId: number) => `clinical-history/anamnesis/patient/${patientId}`,
    periodontal: 'clinical-history/periodontal',
    periodontalBulk: 'clinical-history/periodontal/bulk',
    documents: 'clinical-history/documents',
    documentById: (id: number) => `clinical-history/documents/${id}`,
    documentUpload: 'clinical-history/documents/upload',
    documentDownload: (id: number) => `clinical-history/documents/${id}/download`,
    prescriptions: 'clinical-history/prescriptions',
    prescriptionAnnul: (id: number) => `clinical-history/prescriptions/${id}/annul`,
    clinicalDocuments: 'clinical-history/clinical-docs',
    clinicalDocumentById: (id: number) => `clinical-history/clinical-docs/${id}`,
    consents: 'clinical-history/consents',
    consentSign: (id: number) => `clinical-history/consents/${id}/sign`,
    consentReject: (id: number) => `clinical-history/consents/${id}/reject`,
    timeline: 'clinical-history/timeline',
    summary: (patientId: number) => `clinical-history/summary/${patientId}`
  },
  notifications: {
    registerDevice: 'notifications/register-device'
  },
  dashboard: {
    overview: 'dashboard/overview'
  },
  logs: {
    frontend: 'logs/frontend'
  }
} as const;
