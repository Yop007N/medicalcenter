import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FilesState } from './files.reducer';
import { FileCategory } from '../../models/file.model';

export const selectFilesState = createFeatureSelector<FilesState>('files');

export const selectAllFiles = createSelector(
  selectFilesState,
  state => state.files
);

export const selectSelectedFile = createSelector(
  selectFilesState,
  state => state.selectedFile
);

export const selectFilesLoading = createSelector(
  selectFilesState,
  state => state.loading
);

export const selectFilesUploading = createSelector(
  selectFilesState,
  state => state.uploading
);

export const selectFilesError = createSelector(
  selectFilesState,
  state => state.error
);

// Get files by category
export const selectFilesByCategory = (category: FileCategory) => createSelector(
  selectAllFiles,
  files => files.filter(f => f.category === category)
);

// Get files by patient
export const selectFilesByPatient = (patientId: number) => createSelector(
  selectAllFiles,
  files => files.filter(f => f.patient_id === patientId)
);

// Get image files
export const selectImageFiles = createSelector(
  selectAllFiles,
  files => files.filter(f => f.file_type.startsWith('image/'))
);

// Get PDF files
export const selectPdfFiles = createSelector(
  selectAllFiles,
  files => files.filter(f => f.file_type === 'application/pdf')
);
