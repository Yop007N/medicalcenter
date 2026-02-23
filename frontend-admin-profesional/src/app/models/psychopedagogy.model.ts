// Psychopedagogy Models

export type LevelRating = 'below_grade' | 'at_grade' | 'above_grade';
export type EngagementLevel = 'low' | 'moderate' | 'high';
export type CooperationLevel = 'poor' | 'fair' | 'good' | 'excellent';
export type IndependenceLevel = 'needs_support' | 'some_support' | 'independent';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'mixed';

export interface CognitiveTest {
  date?: string;
  verbal_comprehension?: number;
  visual_spatial?: number;
  fluid_reasoning?: number;
  working_memory?: number;
  processing_speed?: number;
  full_scale_iq?: number;
  score?: number;
  interpretation?: string;
}

export interface EvaluationGoals {
  short_term: string[];
  long_term: string[];
}

export interface PsychopedagogicalEvaluation {
  id: number;
  patient_id: number;
  professional_id: number;
  medical_record_id?: number;
  school_name?: string;
  grade?: string;
  academic_year?: number;
  teacher_name?: string;
  reason: string;
  referred_by?: string;
  presenting_problem?: string;
  cognitive_tests?: Record<string, CognitiveTest>;
  reading_level?: LevelRating;
  reading_score?: number;
  writing_level?: LevelRating;
  writing_score?: number;
  math_level?: LevelRating;
  math_score?: number;
  academic_strengths?: string[];
  academic_weaknesses?: string[];
  emotional_state?: string;
  behavioral_observations?: string;
  social_skills?: string;
  attention_focus?: string;
  motivation?: string;
  learning_style?: LearningStyle;
  preferred_activities?: string[];
  diagnosis?: string;
  learning_difficulties?: string[];
  comorbidities?: string[];
  cognitive_strengths?: string[];
  family_support?: string;
  school_resources?: string;
  recommendations: string;
  intervention_plan?: string;
  classroom_accommodations?: string[];
  educational_strategies?: string[];
  home_strategies?: string[];
  goals?: EvaluationGoals;
  evaluation_date: string;
  next_evaluation_date?: string;
  status: 'active' | 'completed' | 'discontinued';
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

export interface PsychopedagogicalEvaluationCreate {
  patient_id: number;
  reason: string;
  evaluation_date: string;
  recommendations: string;
  school_name?: string;
  grade?: string;
  academic_year?: number;
  teacher_name?: string;
  referred_by?: string;
  presenting_problem?: string;
  reading_level?: LevelRating;
  writing_level?: LevelRating;
  math_level?: LevelRating;
  learning_style?: LearningStyle;
  diagnosis?: string;
  learning_difficulties?: string[];
  intervention_plan?: string;
  classroom_accommodations?: string[];
  goals?: EvaluationGoals;
}

export interface SessionActivity {
  name: string;
  duration: number;
  materials?: string;
  book?: string;
}

export interface InterventionSession {
  id: number;
  evaluation_id: number;
  patient_id: number;
  professional_id: number;
  session_number?: number;
  session_date: string;
  duration_minutes?: number;
  focus_area: string;
  skills_targeted?: string[];
  activities?: SessionActivity[];
  materials_used?: string[];
  student_engagement?: EngagementLevel;
  student_mood?: string;
  cooperation_level?: CooperationLevel;
  task_completion?: number;
  accuracy_rate?: number;
  independence_level?: IndependenceLevel;
  behavioral_notes?: string;
  learning_observations?: string;
  progress_notes?: string;
  homework_assigned?: string;
  parent_communication?: string;
  progress_rating?: number;
  goals_met?: string[];
  challenges_encountered?: string;
  next_session_plan?: string;
  strategy_adjustments?: string;
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

export interface InterventionSessionCreate {
  evaluation_id: number;
  patient_id: number;
  session_date: string;
  focus_area: string;
  session_number?: number;
  duration_minutes?: number;
  skills_targeted?: string[];
  activities?: SessionActivity[];
  materials_used?: string[];
  student_engagement?: EngagementLevel;
  student_mood?: string;
  cooperation_level?: CooperationLevel;
  task_completion?: number;
  accuracy_rate?: number;
  independence_level?: IndependenceLevel;
  behavioral_notes?: string;
  learning_observations?: string;
  progress_notes?: string;
  homework_assigned?: string;
  parent_communication?: string;
  progress_rating?: number;
  goals_met?: string[];
  challenges_encountered?: string;
  next_session_plan?: string;
}

export const FOCUS_AREAS = [
  { value: 'reading_comprehension', label: 'Comprensión Lectora' },
  { value: 'math_skills', label: 'Habilidades Matemáticas' },
  { value: 'writing', label: 'Escritura' },
  { value: 'attention', label: 'Atención y Concentración' },
  { value: 'organization', label: 'Organización' },
  { value: 'memory', label: 'Memoria' },
  { value: 'study_skills', label: 'Técnicas de Estudio' },
  { value: 'phonemic_awareness', label: 'Conciencia Fonémica' },
  { value: 'executive_functions', label: 'Funciones Ejecutivas' },
  { value: 'social_skills', label: 'Habilidades Sociales' }
];

export const LEARNING_DIFFICULTIES = [
  { value: 'dyslexia', label: 'Dislexia' },
  { value: 'dyscalculia', label: 'Discalculia' },
  { value: 'dysgraphia', label: 'Disgrafía' },
  { value: 'ADHD', label: 'TDAH' },
  { value: 'processing_disorder', label: 'Trastorno del Procesamiento' },
  { value: 'autism_spectrum', label: 'Trastorno del Espectro Autista' },
  { value: 'intellectual_disability', label: 'Discapacidad Intelectual' },
  { value: 'language_disorder', label: 'Trastorno del Lenguaje' }
];

export const CLASSROOM_ACCOMMODATIONS = [
  { value: 'extended_time', label: 'Tiempo Extendido' },
  { value: 'quiet_space', label: 'Espacio Tranquilo' },
  { value: 'visual_aids', label: 'Apoyos Visuales' },
  { value: 'chunked_assignments', label: 'Tareas Divididas' },
  { value: 'preferential_seating', label: 'Ubicación Preferencial' },
  { value: 'breaks', label: 'Descansos Frecuentes' },
  { value: 'simplified_instructions', label: 'Instrucciones Simplificadas' },
  { value: 'oral_testing', label: 'Evaluación Oral' },
  { value: 'reduced_homework', label: 'Tarea Reducida' },
  { value: 'assistive_technology', label: 'Tecnología Asistiva' }
];
