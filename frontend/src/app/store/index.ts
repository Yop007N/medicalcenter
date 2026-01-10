import { ActionReducerMap } from '@ngrx/store';
import { authReducer, AuthState } from './auth/auth.reducer';
import { patientsReducer, PatientsState } from './patients/patients.reducer';
import { professionalsReducer, ProfessionalsState } from './professionals/professionals.reducer';
import { appointmentsReducer, AppointmentsState } from './appointments/appointments.reducer';
import { medicalRecordsReducer, MedicalRecordsState } from './medical-records/medical-records.reducer';
import { budgetsReducer, BudgetsState } from './budgets/budgets.reducer';
import { paymentsReducer, PaymentsState } from './payments/payments.reducer';
import { odontologyReducer, OdontologyState } from './odontology/odontology.reducer';
import { psychologyReducer, PsychologyState } from './psychology/psychology.reducer';
import { psychopedagogyReducer, PsychopedagogyState } from './psychopedagogy/psychopedagogy.reducer';
import { filesReducer, FilesState } from './files/files.reducer';
import { reportsReducer, ReportsState } from './reports/reports.reducer';
import { auditReducer, AuditState } from './audit/audit.reducer';

export interface AppState {
  auth: AuthState;
  patients: PatientsState;
  professionals: ProfessionalsState;
  appointments: AppointmentsState;
  medicalRecords: MedicalRecordsState;
  budgets: BudgetsState;
  payments: PaymentsState;
  odontology: OdontologyState;
  psychology: PsychologyState;
  psychopedagogy: PsychopedagogyState;
  files: FilesState;
  reports: ReportsState;
  audit: AuditState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  patients: patientsReducer,
  professionals: professionalsReducer,
  appointments: appointmentsReducer,
  medicalRecords: medicalRecordsReducer,
  budgets: budgetsReducer,
  payments: paymentsReducer,
  odontology: odontologyReducer,
  psychology: psychologyReducer,
  psychopedagogy: psychopedagogyReducer,
  files: filesReducer,
  reports: reportsReducer,
  audit: auditReducer
};

// Re-export with namespaces to avoid conflicts
export * as AuthActions from './auth/auth.actions';
export * from './auth/auth.selectors';
export { AuthState } from './auth/auth.reducer';
export { AuthEffects } from './auth/auth.effects';

export * as PatientsActions from './patients/patients.actions';
export * from './patients/patients.selectors';
export { PatientsState } from './patients/patients.reducer';
export { PatientsEffects } from './patients/patients.effects';

export * as ProfessionalsActions from './professionals/professionals.actions';
export * from './professionals/professionals.selectors';
export { ProfessionalsState } from './professionals/professionals.reducer';
export { ProfessionalsEffects } from './professionals/professionals.effects';

export * as AppointmentsActions from './appointments/appointments.actions';
export * from './appointments/appointments.selectors';
export { AppointmentsState } from './appointments/appointments.reducer';
export { AppointmentsEffects } from './appointments/appointments.effects';

export * as MedicalRecordsActions from './medical-records/medical-records.actions';
export * from './medical-records/medical-records.selectors';
export { MedicalRecordsState } from './medical-records/medical-records.reducer';
export { MedicalRecordsEffects } from './medical-records/medical-records.effects';

export * as BudgetsActions from './budgets/budgets.actions';
export * from './budgets/budgets.selectors';
export { BudgetsState } from './budgets/budgets.reducer';
export { BudgetsEffects } from './budgets/budgets.effects';

export * as PaymentsActions from './payments/payments.actions';
export * from './payments/payments.selectors';
export { PaymentsState } from './payments/payments.reducer';
export { PaymentsEffects } from './payments/payments.effects';

export * as OdontologyActions from './odontology/odontology.actions';
export * from './odontology/odontology.selectors';
export { OdontologyState } from './odontology/odontology.reducer';
export { OdontologyEffects } from './odontology/odontology.effects';

export * as PsychologyActions from './psychology/psychology.actions';
export * from './psychology/psychology.selectors';
export { PsychologyState } from './psychology/psychology.reducer';
export { PsychologyEffects } from './psychology/psychology.effects';

export * as PsychopedagogyActions from './psychopedagogy/psychopedagogy.actions';
export * from './psychopedagogy/psychopedagogy.selectors';
export { PsychopedagogyState } from './psychopedagogy/psychopedagogy.reducer';
export { PsychopedagogyEffects } from './psychopedagogy/psychopedagogy.effects';

export * as FilesActions from './files/files.actions';
export * from './files/files.selectors';
export { FilesState } from './files/files.reducer';
export { FilesEffects } from './files/files.effects';

export * as ReportsActions from './reports/reports.actions';
export * from './reports/reports.selectors';
export { ReportsState } from './reports/reports.reducer';
export { ReportsEffects } from './reports/reports.effects';

export * as AuditActions from './audit/audit.actions';
export * from './audit/audit.selectors';
export { AuditState } from './audit/audit.reducer';
export { AuditEffects } from './audit/audit.effects';
