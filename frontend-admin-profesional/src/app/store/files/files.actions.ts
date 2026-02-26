import { createAction, props } from '@ngrx/store';
import { MedicalFile, FileUpload } from '../../models/file.model';

// Load Files
export const loadFiles = createAction(
  '[Files] Load Files',
  props<{ patientId?: number }>()
);
export const loadFilesSuccess = createAction(
  '[Files] Load Files Success',
  props<{ files: MedicalFile[] }>()
);
export const loadFilesFailure = createAction(
  '[Files] Load Files Failure',
  props<{ error: string }>()
);

// Load Single File
export const loadFile = createAction(
  '[Files] Load File',
  props<{ id: number }>()
);
export const loadFileSuccess = createAction(
  '[Files] Load File Success',
  props<{ file: MedicalFile }>()
);
export const loadFileFailure = createAction(
  '[Files] Load File Failure',
  props<{ error: string }>()
);

// Upload File
export const uploadFile = createAction(
  '[Files] Upload File',
  props<{ file: File; metadata: FileUpload }>()
);
export const uploadFileSuccess = createAction(
  '[Files] Upload File Success',
  props<{ file: MedicalFile }>()
);
export const uploadFileFailure = createAction(
  '[Files] Upload File Failure',
  props<{ error: string; patientId?: number }>()
);

// Delete File
export const deleteFile = createAction(
  '[Files] Delete File',
  props<{ id: number }>()
);
export const deleteFileSuccess = createAction(
  '[Files] Delete File Success',
  props<{ id: number }>()
);
export const deleteFileFailure = createAction(
  '[Files] Delete File Failure',
  props<{ error: string }>()
);

// Download File
export const downloadFile = createAction(
  '[Files] Download File',
  props<{ id: number; filename: string }>()
);
export const downloadFileSuccess = createAction(
  '[Files] Download File Success'
);
export const downloadFileFailure = createAction(
  '[Files] Download File Failure',
  props<{ error: string }>()
);

// Clear
export const clearFilesState = createAction('[Files] Clear State');
export const clearError = createAction('[Files] Clear Error');
