export const API_ENDPOINTS = {
  auth: {
    login: 'auth/login'
  },
  patients: {
    byId: (id: number) => `patients/${id}`,
    appointments: (id: number) => `patients/${id}/appointments`,
    budgets: (id: number) => `patients/${id}/budgets`
  },
  budgets: {
    accept: (id: number) => `budgets/${id}/accept`
  },
  sync: {
    status: 'sync/status',
    pull: 'sync/pull',
    push: 'sync/push'
  },
  clinicalHistory: {
    summary: (patientId: number) => `clinical-history/summary/${patientId}`,
    timeline: 'clinical-history/timeline',
    documents: 'clinical-history/documents',
    documentDownload: (documentId: number) => `clinical-history/documents/${documentId}/download`,
    consents: 'clinical-history/consents',
    consentSign: (consentId: number) => `clinical-history/consents/${consentId}/sign`,
    consentReject: (consentId: number) => `clinical-history/consents/${consentId}/reject`
  }
} as const;
