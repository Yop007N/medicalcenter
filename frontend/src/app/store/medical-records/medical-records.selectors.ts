import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MedicalRecordsState } from './medical-records.reducer';

export const selectMedicalRecordsState = createFeatureSelector<MedicalRecordsState>('medicalRecords');

export const selectAllMedicalRecords = createSelector(
  selectMedicalRecordsState,
  state => state.medicalRecords
);

export const selectSelectedMedicalRecord = createSelector(
  selectMedicalRecordsState,
  state => state.selectedRecord
);

export const selectMedicalRecordsLoading = createSelector(
  selectMedicalRecordsState,
  state => state.loading
);

export const selectMedicalRecordsUploading = createSelector(
  selectMedicalRecordsState,
  state => state.uploading
);

export const selectMedicalRecordsError = createSelector(
  selectMedicalRecordsState,
  state => state.error
);

export const selectMedicalRecordFiles = createSelector(
  selectSelectedMedicalRecord,
  record => record?.files || []
);

export const selectMedicalRecordsByPatient = (patientId: number) => createSelector(
  selectAllMedicalRecords,
  records => records.filter(r => r.patient_id === patientId)
);
