import { createAction, props } from '@ngrx/store';
import { MedicalRecord, MedicalRecordCreate, MedicalFile } from '../../models/medical-record.model';

// Load Medical Records
export const loadMedicalRecords = createAction(
  '[Medical Records] Load Medical Records',
  props<{ patientId?: number; professionalId?: number; specialtyKey?: string }>()
);
export const loadMedicalRecordsSuccess = createAction(
  '[Medical Records] Load Medical Records Success',
  props<{ medicalRecords: MedicalRecord[] }>()
);
export const loadMedicalRecordsFailure = createAction(
  '[Medical Records] Load Medical Records Failure',
  props<{ error: string }>()
);

// Load Single Medical Record
export const loadMedicalRecord = createAction(
  '[Medical Records] Load Medical Record',
  props<{ id: number }>()
);
export const loadMedicalRecordSuccess = createAction(
  '[Medical Records] Load Medical Record Success',
  props<{ medicalRecord: MedicalRecord }>()
);
export const loadMedicalRecordFailure = createAction(
  '[Medical Records] Load Medical Record Failure',
  props<{ error: string }>()
);

// Create Medical Record
export const createMedicalRecord = createAction(
  '[Medical Records] Create Medical Record',
  props<{ medicalRecord: MedicalRecordCreate }>()
);
export const createMedicalRecordSuccess = createAction(
  '[Medical Records] Create Medical Record Success',
  props<{ medicalRecord: MedicalRecord }>()
);
export const createMedicalRecordFailure = createAction(
  '[Medical Records] Create Medical Record Failure',
  props<{ error: string }>()
);

// Update Medical Record
export const updateMedicalRecord = createAction(
  '[Medical Records] Update Medical Record',
  props<{ id: number; medicalRecord: Partial<MedicalRecordCreate> }>()
);
export const updateMedicalRecordSuccess = createAction(
  '[Medical Records] Update Medical Record Success',
  props<{ medicalRecord: MedicalRecord }>()
);
export const updateMedicalRecordFailure = createAction(
  '[Medical Records] Update Medical Record Failure',
  props<{ error: string }>()
);

// Delete Medical Record
export const deleteMedicalRecord = createAction(
  '[Medical Records] Delete Medical Record',
  props<{ id: number }>()
);
export const deleteMedicalRecordSuccess = createAction(
  '[Medical Records] Delete Medical Record Success',
  props<{ id: number }>()
);
export const deleteMedicalRecordFailure = createAction(
  '[Medical Records] Delete Medical Record Failure',
  props<{ error: string }>()
);

// Upload File
export const uploadFile = createAction(
  '[Medical Records] Upload File',
  props<{ medicalRecordId: number; file: File; fileType?: string; description?: string }>()
);
export const uploadFileSuccess = createAction(
  '[Medical Records] Upload File Success',
  props<{ file: MedicalFile }>()
);
export const uploadFileFailure = createAction(
  '[Medical Records] Upload File Failure',
  props<{ error: string }>()
);

// Delete File
export const deleteFile = createAction(
  '[Medical Records] Delete File',
  props<{ fileId: number }>()
);
export const deleteFileSuccess = createAction(
  '[Medical Records] Delete File Success',
  props<{ fileId: number }>()
);
export const deleteFileFailure = createAction(
  '[Medical Records] Delete File Failure',
  props<{ error: string }>()
);

// Clear state
export const clearError = createAction('[Medical Records] Clear Error');
export const clearSelectedRecord = createAction('[Medical Records] Clear Selected Record');
