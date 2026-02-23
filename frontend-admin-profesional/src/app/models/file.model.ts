// File Models

export type FileCategory = 'medical' | 'identification' | 'insurance' | 'consent' | 'prescription' | 'lab_result' | 'imaging' | 'other';

export interface MedicalFile {
  id: number;
  patient_id: number;
  uploaded_by: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  category: FileCategory;
  description?: string;
  is_private: boolean;
  medical_record_id?: number;
  appointment_id?: number;
  upload_date: string;
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  uploader?: {
    id: number;
    email: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface FileUpload {
  patient_id: number;
  category: FileCategory;
  description?: string;
  is_private?: boolean;
  medical_record_id?: number;
  appointment_id?: number;
}

export const FILE_CATEGORIES = [
  { value: 'medical', label: 'Documento Médico' },
  { value: 'identification', label: 'Identificación' },
  { value: 'insurance', label: 'Seguro/Obra Social' },
  { value: 'consent', label: 'Consentimiento' },
  { value: 'prescription', label: 'Receta' },
  { value: 'lab_result', label: 'Resultado de Laboratorio' },
  { value: 'imaging', label: 'Imagen/Radiografía' },
  { value: 'other', label: 'Otro' }
];

export function getFileCategoryLabel(category: FileCategory): string {
  const found = FILE_CATEGORIES.find(c => c.value === category);
  return found ? found.label : category;
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return 'image-outline';
  if (fileType === 'application/pdf') return 'document-text-outline';
  if (fileType.includes('word') || fileType.includes('document')) return 'document-outline';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'grid-outline';
  return 'document-attach-outline';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
