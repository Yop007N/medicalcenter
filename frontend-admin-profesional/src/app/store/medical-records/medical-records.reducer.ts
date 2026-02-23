import { createReducer, on } from '@ngrx/store';
import { MedicalRecord, MedicalFile } from '../../models/medical-record.model';
import * as MedicalRecordsActions from './medical-records.actions';

export interface MedicalRecordsState {
  medicalRecords: MedicalRecord[];
  selectedRecord: MedicalRecord | null;
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

export const initialState: MedicalRecordsState = {
  medicalRecords: [],
  selectedRecord: null,
  loading: false,
  uploading: false,
  error: null
};

export const medicalRecordsReducer = createReducer(
  initialState,

  // Load Medical Records
  on(MedicalRecordsActions.loadMedicalRecords, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(MedicalRecordsActions.loadMedicalRecordsSuccess, (state, { medicalRecords }) => ({
    ...state,
    medicalRecords,
    loading: false
  })),
  on(MedicalRecordsActions.loadMedicalRecordsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Medical Record
  on(MedicalRecordsActions.loadMedicalRecord, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(MedicalRecordsActions.loadMedicalRecordSuccess, (state, { medicalRecord }) => ({
    ...state,
    selectedRecord: medicalRecord,
    loading: false
  })),
  on(MedicalRecordsActions.loadMedicalRecordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Medical Record
  on(MedicalRecordsActions.createMedicalRecord, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(MedicalRecordsActions.createMedicalRecordSuccess, (state, { medicalRecord }) => ({
    ...state,
    medicalRecords: [medicalRecord, ...state.medicalRecords],
    selectedRecord: medicalRecord,
    loading: false
  })),
  on(MedicalRecordsActions.createMedicalRecordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Medical Record
  on(MedicalRecordsActions.updateMedicalRecord, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(MedicalRecordsActions.updateMedicalRecordSuccess, (state, { medicalRecord }) => ({
    ...state,
    medicalRecords: state.medicalRecords.map(r =>
      r.id === medicalRecord.id ? medicalRecord : r
    ),
    selectedRecord: medicalRecord,
    loading: false
  })),
  on(MedicalRecordsActions.updateMedicalRecordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Medical Record
  on(MedicalRecordsActions.deleteMedicalRecord, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(MedicalRecordsActions.deleteMedicalRecordSuccess, (state, { id }) => ({
    ...state,
    medicalRecords: state.medicalRecords.filter(r => r.id !== id),
    selectedRecord: state.selectedRecord?.id === id ? null : state.selectedRecord,
    loading: false
  })),
  on(MedicalRecordsActions.deleteMedicalRecordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Upload File
  on(MedicalRecordsActions.uploadFile, state => ({
    ...state,
    uploading: true,
    error: null
  })),
  on(MedicalRecordsActions.uploadFileSuccess, (state, { file }) => {
    const updatedRecord = state.selectedRecord
      ? {
          ...state.selectedRecord,
          files: [...(state.selectedRecord.files || []), file]
        }
      : null;
    return {
      ...state,
      selectedRecord: updatedRecord,
      uploading: false
    };
  }),
  on(MedicalRecordsActions.uploadFileFailure, (state, { error }) => ({
    ...state,
    uploading: false,
    error
  })),

  // Delete File
  on(MedicalRecordsActions.deleteFile, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(MedicalRecordsActions.deleteFileSuccess, (state, { fileId }) => {
    const updatedRecord = state.selectedRecord
      ? {
          ...state.selectedRecord,
          files: (state.selectedRecord.files || []).filter(f => f.id !== fileId)
        }
      : null;
    return {
      ...state,
      selectedRecord: updatedRecord,
      loading: false
    };
  }),
  on(MedicalRecordsActions.deleteFileFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear
  on(MedicalRecordsActions.clearError, state => ({
    ...state,
    error: null
  })),
  on(MedicalRecordsActions.clearSelectedRecord, state => ({
    ...state,
    selectedRecord: null
  }))
);
