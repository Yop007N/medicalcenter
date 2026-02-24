// Odontology Models

export type ToothStatus = 'healthy' | 'caries' | 'filled' | 'crown' | 'implant' | 'missing' | 'root_canal' | 'fractured' | 'mobile' | 'to_extract' | 'extracted';
export type SurfaceCondition = 'healthy' | 'caries' | 'filled' | 'composite' | 'amalgam';
export type ToothType = 'permanent' | 'deciduous';
export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type TreatmentPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Tooth {
  id: number;
  odontogram_id: number;
  tooth_number: number;
  tooth_type?: ToothType;
  status: ToothStatus;
  mesial?: SurfaceCondition;
  distal?: SurfaceCondition;
  oclusal?: SurfaceCondition;
  vestibular?: SurfaceCondition;
  lingual?: SurfaceCondition;
  notes?: string;
  sensitivity?: string;
  mobility?: number;
  gingival_status?: string;
  pocket_depth?: number;
  planned_treatment?: string;
  treatment_priority?: TreatmentPriority;
  created_at: string;
  updated_at?: string;
}

export interface Odontogram {
  id: number;
  patient_id: number;
  professional_id: number;
  notes?: string;
  is_active: boolean;
  teeth?: Tooth[];
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface OdontogramCreate {
  patient_id: number;
  professional_id?: number;
  is_active?: boolean;
  notes?: string;
}

export interface ToothUpdate {
  status?: ToothStatus;
  mesial?: SurfaceCondition;
  distal?: SurfaceCondition;
  oclusal?: SurfaceCondition;
  vestibular?: SurfaceCondition;
  lingual?: SurfaceCondition;
  notes?: string;
  sensitivity?: string;
  mobility?: number;
  gingival_status?: string;
  pocket_depth?: number;
  planned_treatment?: string;
  treatment_priority?: TreatmentPriority;
}

export interface DentalTreatment {
  id: number;
  patient_id: number;
  professional_id: number;
  medical_record_id?: number;
  appointment_id?: number;
  treatment_code?: string;
  treatment_type: string;
  affected_teeth?: number[];
  description?: string;
  materials_used?: string[];
  technique?: string;
  anesthesia_type?: string;
  anesthesia_details?: string;
  treatment_date: string;
  duration_minutes?: number;
  sessions_required?: number;
  session_number?: number;
  status: TreatmentStatus;
  completion_date?: string;
  next_appointment?: string;
  estimated_cost?: number;
  final_cost?: number;
  insurance_covered?: number;
  patient_payment?: number;
  pre_treatment_notes?: string;
  post_treatment_notes?: string;
  complications?: string;
  care_instructions?: string;
  medications_prescribed?: any[];
  patient_satisfaction?: number;
  treatment_success?: boolean;
  requires_followup?: boolean;
  followup_date?: string;
  followup_notes?: string;
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface DentalTreatmentCreate {
  patient_id: number;
  treatment_type: string;
  treatment_date: string;
  affected_teeth?: number[];
  description?: string;
  materials_used?: string[];
  technique?: string;
  anesthesia_type?: string;
  duration_minutes?: number;
  sessions_required?: number;
  estimated_cost?: number;
  pre_treatment_notes?: string;
  care_instructions?: string;
}

export interface DentalTreatmentUpdate {
  treatment_type?: string;
  affected_teeth?: number[];
  description?: string;
  materials_used?: string[];
  technique?: string;
  anesthesia_type?: string;
  duration_minutes?: number;
  status?: TreatmentStatus;
  session_number?: number;
  completion_date?: string;
  next_appointment?: string;
  final_cost?: number;
  insurance_covered?: number;
  patient_payment?: number;
  post_treatment_notes?: string;
  complications?: string;
  care_instructions?: string;
  medications_prescribed?: any[];
  patient_satisfaction?: number;
  treatment_success?: boolean;
  requires_followup?: boolean;
  followup_date?: string;
  followup_notes?: string;
}

// Tooth positions for odontogram visualization
export const PERMANENT_TEETH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38]
};

export const DECIDUOUS_TEETH = {
  upperRight: [55, 54, 53, 52, 51],
  upperLeft: [61, 62, 63, 64, 65],
  lowerRight: [85, 84, 83, 82, 81],
  lowerLeft: [71, 72, 73, 74, 75]
};

export const TREATMENT_TYPES = [
  { value: 'filling', label: 'Empaste/Obturación' },
  { value: 'root_canal', label: 'Endodoncia' },
  { value: 'extraction', label: 'Extracción' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'crown', label: 'Corona' },
  { value: 'implant', label: 'Implante' },
  { value: 'orthodontics', label: 'Ortodoncia' },
  { value: 'whitening', label: 'Blanqueamiento' },
  { value: 'veneer', label: 'Carilla' },
  { value: 'bridge', label: 'Puente' },
  { value: 'denture', label: 'Prótesis' },
  { value: 'sealant', label: 'Sellador' },
  { value: 'scaling', label: 'Raspado' },
  { value: 'gum_surgery', label: 'Cirugía de Encías' }
];

export const TOOTH_STATUS_COLORS: Record<ToothStatus, string> = {
  healthy: '#4CAF50',
  caries: '#F44336',
  filled: '#2196F3',
  crown: '#9C27B0',
  implant: '#FF9800',
  missing: '#9E9E9E',
  root_canal: '#795548',
  fractured: '#E91E63',
  mobile: '#FFEB3B',
  to_extract: '#FF5722',
  extracted: '#607D8B'
};

// ==========================================
// Historia Clínica Odontológica - Modelos
// ==========================================

export type HistoryEventType = 'budget_created' | 'appointment_scheduled' | 'appointment_confirmed' |
  'appointment_completed' | 'treatment_started' | 'treatment_completed' | 'evolution_added' |
  'document_uploaded' | 'prescription_created' | 'consent_signed' | 'email_sent';

export type EvolutionStatus = 'draft' | 'signed' | 'annulled';
export type PrescriptionStatus = 'active' | 'completed' | 'annulled';
export type ConsentStatus = 'pending' | 'signed' | 'rejected' | 'annulled';
export type DocumentType = 'xray' | 'photo' | 'lab_result' | 'referral' | 'other';

// Historial - Timeline de eventos
export interface ClinicalHistoryEvent {
  id: number;
  patient_id: number;
  professional_id: number;
  event_type: HistoryEventType;
  event_date: string;
  title: string;
  description?: string;
  reference_id?: number;
  reference_type?: string;
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

// Evoluciones - Registro de tratamientos con firmas
export interface Evolution {
  id: number;
  patient_id: number;
  professional_id: number;
  treatment_plan_id?: number;
  action_performed: string;
  action_code?: string;
  description?: string;
  notes?: string;
  affected_teeth?: number[];
  status: EvolutionStatus;
  professional_signature?: string;
  professional_signed_at?: string;
  patient_signature?: string;
  patient_signed_at?: string;
  annulled_reason?: string;
  annulled_at?: string;
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  treatment_plan?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface EvolutionCreate {
  patient_id: number;
  treatment_plan_id?: number;
  action_performed: string;
  action_code?: string;
  description?: string;
  notes?: string;
  affected_teeth?: number[];
}

// Ficha de Anamnesis
export interface Anamnesis {
  id: number;
  patient_id: number;
  professional_id: number;
  // Motivo de consulta
  consultation_reason?: string[];
  consultation_reason_other?: string;
  // Enfermedad actual
  current_illness?: string[];
  current_illness_other?: string;
  // Alertas médicas
  medical_alerts?: string[];
  medical_alerts_other?: string;
  // Medicamentos
  medications?: string[];
  medications_other?: string;
  // Hábitos
  habits?: string[];
  habits_other?: string;
  // Antecedentes
  family_history?: string;
  personal_history?: string;
  surgical_history?: string;
  // Estado general
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface AnamnesisCreate {
  patient_id: number;
  consultation_reason?: string[];
  consultation_reason_other?: string;
  current_illness?: string[];
  current_illness_other?: string;
  medical_alerts?: string[];
  medical_alerts_other?: string;
  medications?: string[];
  medications_other?: string;
  habits?: string[];
  habits_other?: string;
  family_history?: string;
  personal_history?: string;
  surgical_history?: string;
  notes?: string;
}

// Periodontograma
export interface PeriodontalRecord {
  id: number;
  patient_id: number;
  professional_id: number;
  version_date: string;
  notes?: string;
  teeth_records: PeriodontalToothRecord[];
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface PeriodontalToothRecord {
  tooth_number: number;
  // Vestibular (3 puntos: mesial, central, distal)
  probing_depth_vestibular: [number, number, number];
  margin_vestibular: [number, number, number];
  nic_vestibular: [number, number, number];
  // Lingual/Palatino (3 puntos)
  probing_depth_lingual: [number, number, number];
  margin_lingual: [number, number, number];
  nic_lingual: [number, number, number];
  // Otros indicadores
  furcation?: number; // 0-3
  mobility?: number; // 0-3
  bleeding?: boolean;
  suppuration?: boolean;
  plaque?: boolean;
}

export interface PeriodontalRecordCreate {
  patient_id: number;
  notes?: string;
  teeth_records: PeriodontalToothRecord[];
}

// Rx y Documentos
export interface PatientDocument {
  id: number;
  patient_id: number;
  professional_id: number;
  document_type: DocumentType;
  title?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  tooth_numbers?: number[];
  is_active: boolean;
  uploaded_at: string;
  created_at?: string; // Alias for uploaded_at for consistency
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface PatientDocumentCreate {
  patient_id: number;
  document_type: DocumentType;
  file: File;
  description?: string;
  tooth_numbers?: number[];
}

// Recetas
export interface Prescription {
  id: number;
  patient_id: number;
  professional_id: number;
  treatment_id?: number;
  prescription_date: string;
  content: string;
  medications?: PrescriptionMedication[];
  diagnosis?: string;
  instructions?: string;
  status: PrescriptionStatus;
  annulled_reason?: string;
  annulled_at?: string;
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
    license_number?: string;
  };
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface PrescriptionCreate {
  patient_id: number;
  treatment_id?: number;
  content: string;
  medications?: PrescriptionMedication[];
  diagnosis?: string;
  instructions?: string;
}

// Documentos Clínicos
export interface ClinicalDocument {
  id: number;
  patient_id: number;
  professional_id: number;
  document_type: string;
  title: string;
  content: string;
  template_id?: number;
  is_active: boolean;
  annulled_reason?: string;
  annulled_at?: string;
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface ClinicalDocumentCreate {
  patient_id: number;
  document_type: string;
  title: string;
  content: string;
  template_id?: number;
}

// Consentimientos Informados
export interface InformedConsent {
  id: number;
  patient_id: number;
  professional_id: number;
  treatment_id?: number;
  consent_type: string;
  title: string;
  content: string;
  status: ConsentStatus;
  patient_signature?: string;
  patient_signed_at?: string;
  witness_name?: string;
  witness_signature?: string;
  witness_signed_at?: string;
  rejected_reason?: string;
  annulled_reason?: string;
  annulled_at?: string;
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface InformedConsentCreate {
  patient_id: number;
  treatment_id?: number;
  consent_type: string;
  title: string;
  content: string;
}

// Constantes para la ficha de anamnesis
export const CONSULTATION_REASONS = [
  { value: 'caries', label: 'Caries' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'evaluation', label: 'Valoración' },
  { value: 'pain', label: 'Dolor' },
  { value: 'bleeding', label: 'Sangrado' },
  { value: 'sensitivity', label: 'Sensibilidad' },
  { value: 'aesthetics', label: 'Estética' },
  { value: 'orthodontics', label: 'Ortodoncia' },
  { value: 'prosthesis', label: 'Prótesis' },
  { value: 'extraction', label: 'Extracción' }
];

export const CURRENT_ILLNESSES = [
  { value: 'periodontal', label: 'Enfermedad Periodontal' },
  { value: 'gingivitis', label: 'Gingivitis' },
  { value: 'bruxism', label: 'Bruxismo' },
  { value: 'tmj', label: 'Trastorno ATM' },
  { value: 'halitosis', label: 'Halitosis' }
];

export const MEDICAL_ALERTS = [
  { value: 'food_allergy', label: 'Alergia a Alimentos' },
  { value: 'drug_allergy', label: 'Alergia a Medicamentos' },
  { value: 'latex_allergy', label: 'Alergia al Látex' },
  { value: 'anesthesia_allergy', label: 'Alergia a Anestesia' },
  { value: 'heart_disease', label: 'Enfermedad Cardíaca' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'hypertension', label: 'Hipertensión' },
  { value: 'pregnancy', label: 'Embarazo' },
  { value: 'bleeding_disorder', label: 'Trastorno de Coagulación' }
];

export const MEDICATIONS_LIST = [
  { value: 'antibiotics', label: 'Antibióticos' },
  { value: 'anticonvulsants', label: 'Anticonvulsivos' },
  { value: 'antidepressants', label: 'Antidepresivos' },
  { value: 'antidiabetics', label: 'Antiglucemiantes' },
  { value: 'antihypertensives', label: 'Antihipertensivos' },
  { value: 'bisphosphonates', label: 'Bifosfonatos' },
  { value: 'antidiarrheals', label: 'Antidiarreicos' },
  { value: 'anticoagulants', label: 'Anticoagulantes' },
  { value: 'corticosteroids', label: 'Corticosteroides' },
  { value: 'immunosuppressants', label: 'Inmunosupresores' }
];

export const HABITS_LIST = [
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'bruxism', label: 'Bruxismo' },
  { value: 'drugs', label: 'Drogas' },
  { value: 'smoking', label: 'Tabaquismo' },
  { value: 'nail_biting', label: 'Onicofagia' },
  { value: 'mouth_breathing', label: 'Respiración Bucal' },
  { value: 'thumb_sucking', label: 'Succión Digital' }
];

export const CONSENT_TYPES = [
  { value: 'general', label: 'Consentimiento General' },
  { value: 'extraction', label: 'Extracción Dental' },
  { value: 'root_canal', label: 'Endodoncia' },
  { value: 'implant', label: 'Implante Dental' },
  { value: 'surgery', label: 'Cirugía Oral' },
  { value: 'orthodontics', label: 'Ortodoncia' },
  { value: 'anesthesia', label: 'Anestesia' },
  { value: 'xray', label: 'Radiografías' },
  { value: 'prosthesis', label: 'Prótesis' },
  { value: 'whitening', label: 'Blanqueamiento' }
];

export const CLINICAL_DOCUMENT_TYPES = [
  { value: 'certificate', label: 'Certificado' },
  { value: 'report', label: 'Informe' },
  { value: 'referral', label: 'Derivación' },
  { value: 'treatment_plan', label: 'Plan de Tratamiento' },
  { value: 'discharge', label: 'Alta Médica' },
  { value: 'disability', label: 'Incapacidad' }
];
