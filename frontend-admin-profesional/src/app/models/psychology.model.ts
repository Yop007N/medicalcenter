// Psychology Models

export type EvaluationStatus = 'active' | 'completed' | 'discontinued';
export type RiskLevel = 'none' | 'low' | 'moderate' | 'high';
export type SessionOutcome = 'productive' | 'some_progress' | 'difficult' | 'breakthrough';
export type ProgressRating = 1 | 2 | 3 | 4 | 5;

export interface Symptom {
  symptom: string;
  severity: string;
  frequency: string;
}

export interface TestResult {
  date?: string;
  score: number;
  interpretation: string;
  range?: string;
  profile?: string;
  validity?: string;
}

export interface TreatmentGoals {
  short_term: string[];
  long_term: string[];
}

export interface PsychologicalEvaluation {
  id: number;
  patient_id: number;
  professional_id: number;
  medical_record_id?: number;
  reason: string;
  referred_by?: string;
  presenting_problem?: string;
  symptoms_duration?: string;
  current_symptoms?: Symptom[];
  personal_history?: string;
  family_history?: string;
  medical_history?: string;
  psychiatric_history?: string;
  substance_use?: string;
  living_situation?: string;
  employment_status?: string;
  relationship_status?: string;
  support_system?: string;
  stressors?: string[];
  appearance?: string;
  behavior?: string;
  speech?: string;
  mood?: string;
  affect?: string;
  thought_process?: string;
  thought_content?: string;
  perception?: string;
  cognition?: string;
  insight?: string;
  judgment?: string;
  tests_administered?: Record<string, TestResult>;
  suicide_risk?: RiskLevel;
  suicide_history?: string;
  homicide_risk?: RiskLevel;
  self_harm_risk?: RiskLevel;
  safety_concerns?: string;
  protective_factors?: string[];
  primary_diagnosis: string;
  dsm5_code?: string;
  secondary_diagnoses?: string[];
  differential_diagnoses?: string[];
  comorbidities?: string[];
  patient_strengths?: string[];
  coping_mechanisms?: string;
  previous_treatment?: string;
  treatment_recommendations: string;
  therapy_type?: string;
  frequency_recommended?: string;
  duration_estimate?: string;
  psychiatry_referral?: boolean;
  medication_recommended?: boolean;
  other_referrals?: string[];
  treatment_goals?: TreatmentGoals;
  next_evaluation_date?: string;
  evaluation_date: string;
  status: EvaluationStatus;
  additional_notes?: string;
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

export interface PsychologicalEvaluationCreate {
  patient_id: number;
  reason: string;
  evaluation_date: string;
  primary_diagnosis: string;
  treatment_recommendations: string;
  referred_by?: string;
  presenting_problem?: string;
  symptoms_duration?: string;
  current_symptoms?: Symptom[];
  personal_history?: string;
  family_history?: string;
  therapy_type?: string;
  frequency_recommended?: string;
  duration_estimate?: string;
  treatment_goals?: TreatmentGoals;
}

export interface SymptomSeverity {
  level: number;
  scale: string;
}

export interface GoalProgress {
  goal: string;
  status: string;
  progress: string;
}

export interface Intervention {
  technique: string;
  target?: string;
  purpose?: string;
}

export interface TherapySession {
  id: number;
  evaluation_id: number;
  patient_id: number;
  professional_id: number;
  session_number?: number;
  session_date: string;
  duration_minutes?: number;
  session_type?: string;
  modality?: string;
  presenting_issues?: string[];
  patient_mood?: string;
  patient_affect?: string;
  appearance_behavior?: string;
  topics_discussed?: string[];
  interventions_used?: Intervention[];
  therapy_techniques?: string[];
  homework_assigned?: string;
  homework_compliance?: string;
  insights_gained?: string;
  behavioral_changes?: string;
  emotional_regulation?: string;
  symptom_severity?: Record<string, SymptomSeverity>;
  crisis_intervention?: boolean;
  safety_assessment?: string;
  risk_level?: RiskLevel;
  progress_rating?: ProgressRating;
  goals_progress?: GoalProgress[];
  therapeutic_alliance?: string;
  patient_engagement?: string;
  barriers?: string;
  challenges_encountered?: string;
  session_notes: string;
  clinical_impressions?: string;
  next_session_plan?: string;
  focus_areas?: string[];
  treatment_plan_changes?: string;
  referrals_made?: string[];
  medication_discussion?: string;
  medication_compliance?: string;
  session_outcome?: SessionOutcome;
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

export interface TherapySessionCreate {
  evaluation_id: number;
  patient_id: number;
  session_date: string;
  session_notes: string;
  session_number?: number;
  duration_minutes?: number;
  session_type?: string;
  modality?: string;
  presenting_issues?: string[];
  patient_mood?: string;
  patient_affect?: string;
  topics_discussed?: string[];
  interventions_used?: Intervention[];
  therapy_techniques?: string[];
  homework_assigned?: string;
  progress_rating?: ProgressRating;
  goals_progress?: GoalProgress[];
  next_session_plan?: string;
  session_outcome?: SessionOutcome;
}

export const THERAPY_TYPES = [
  { value: 'CBT', label: 'Terapia Cognitivo-Conductual (TCC)' },
  { value: 'DBT', label: 'Terapia Dialéctica Conductual (DBT)' },
  { value: 'psychodynamic', label: 'Terapia Psicodinámica' },
  { value: 'humanistic', label: 'Terapia Humanista' },
  { value: 'EMDR', label: 'EMDR' },
  { value: 'ACT', label: 'Terapia de Aceptación y Compromiso' },
  { value: 'gestalt', label: 'Terapia Gestalt' },
  { value: 'systemic', label: 'Terapia Sistémica' },
  { value: 'brief', label: 'Terapia Breve' }
];

export const MOOD_OPTIONS = [
  { value: 'depressed', label: 'Deprimido' },
  { value: 'anxious', label: 'Ansioso' },
  { value: 'euphoric', label: 'Eufórico' },
  { value: 'irritable', label: 'Irritable' },
  { value: 'euthymic', label: 'Eutímico' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'positive', label: 'Positivo' },
  { value: 'mixed', label: 'Mixto' }
];

export const SESSION_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'couples', label: 'Pareja' },
  { value: 'family', label: 'Familiar' },
  { value: 'group', label: 'Grupal' }
];
