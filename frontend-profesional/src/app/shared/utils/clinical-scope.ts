export type ClinicalWorkspaceRoute =
  | 'appointments'
  | 'medical-records'
  | 'files'
  | 'budgets'
  | 'payments';

type ClinicalScopeParamsInput = {
  patientId?: number | null;
  specialtyKey?: string | null;
  budgetId?: number | null;
  mode?: 'create' | null;
};

export function buildClinicalScopeQueryParams({
  patientId,
  specialtyKey,
  budgetId,
  mode
}: ClinicalScopeParamsInput): Record<string, string | number> {
  const queryParams: Record<string, string | number> = {};

  if (typeof patientId === 'number' && Number.isInteger(patientId) && patientId > 0) {
    queryParams['patient_id'] = patientId;
  }
  if (typeof budgetId === 'number' && Number.isInteger(budgetId) && budgetId > 0) {
    queryParams['budget_id'] = budgetId;
  }
  if (specialtyKey && specialtyKey.trim()) {
    queryParams['specialty_key'] = specialtyKey.trim();
  }
  if (mode) {
    queryParams['mode'] = mode;
  }

  return queryParams;
}
