import { createReducer, on } from '@ngrx/store';
import { MedicalFile } from '../../models/file.model';
import * as FilesActions from './files.actions';

export interface FilesState {
  files: MedicalFile[];
  selectedFile: MedicalFile | null;
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

export const initialState: FilesState = {
  files: [],
  selectedFile: null,
  loading: false,
  uploading: false,
  error: null
};

export const filesReducer = createReducer(
  initialState,

  // Load Files
  on(FilesActions.loadFiles, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FilesActions.loadFilesSuccess, (state, { files }) => ({
    ...state,
    files,
    loading: false
  })),
  on(FilesActions.loadFilesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single File
  on(FilesActions.loadFile, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FilesActions.loadFileSuccess, (state, { file }) => ({
    ...state,
    selectedFile: file,
    loading: false
  })),
  on(FilesActions.loadFileFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Upload File
  on(FilesActions.uploadFile, state => ({
    ...state,
    uploading: true,
    error: null
  })),
  on(FilesActions.uploadFileSuccess, (state, { file }) => ({
    ...state,
    files: [...state.files, file],
    uploading: false
  })),
  on(FilesActions.uploadFileFailure, (state, { error }) => ({
    ...state,
    uploading: false,
    error
  })),

  // Delete File
  on(FilesActions.deleteFile, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FilesActions.deleteFileSuccess, (state, { id }) => ({
    ...state,
    files: state.files.filter(f => f.id !== id),
    selectedFile: state.selectedFile?.id === id ? null : state.selectedFile,
    loading: false
  })),
  on(FilesActions.deleteFileFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Download
  on(FilesActions.downloadFile, state => ({
    ...state,
    loading: true
  })),
  on(FilesActions.downloadFileSuccess, state => ({
    ...state,
    loading: false
  })),
  on(FilesActions.downloadFileFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear
  on(FilesActions.clearFilesState, () => initialState),
  on(FilesActions.clearError, state => ({
    ...state,
    error: null
  }))
);
