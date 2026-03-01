export type SpecialtyFieldType = 'text' | 'number' | 'date' | 'select' | 'textarea';
export type SpecialtyFieldTarget = 'vitals' | 'payload';

export type SpecialtyFieldDefinition = {
  key: string;
  label: string;
  type: SpecialtyFieldType;
  target: SpecialtyFieldTarget;
  placeholder?: string;
  min?: number;
  step?: string;
  options?: Array<{ value: string; label: string }>;
};

export interface SpecialtyInsightCard {
  label: string;
  value: string;
  description: string;
}

export interface SpecialtyBoardFieldValue {
  label: string;
  value: string;
}

export interface SpecialtyBoardSectionView {
  title: string;
  description: string;
  items: SpecialtyBoardFieldValue[];
}

export interface SpecialtyPrimaryQuickAction {
  label: string;
  route: string;
}

type SpecialtyEncounterLike = {
  status?: string | null;
  diagnosis?: string | null;
  chief_complaint?: string | null;
  visit_date?: string | null;
  payload?: Record<string, unknown> | null;
  vitals?: Record<string, unknown> | null;
};

type SpecialtyBoardSectionConfig = {
  title: string;
  description: string;
  fieldKeys: string[];
};

export const LEGACY_SPECIALTY_MODULES = new Set(['odontology', 'psychology', 'psychopedagogy']);

export const DEFAULT_SPECIALTY_FIELDS: SpecialtyFieldDefinition[] = [
  {
    key: 'blood_pressure',
    label: 'Presion arterial',
    type: 'text',
    target: 'vitals',
    placeholder: 'Ej: 120/80'
  },
  {
    key: 'heart_rate',
    label: 'Frecuencia cardiaca (bpm)',
    type: 'number',
    target: 'vitals',
    min: 0
  },
  {
    key: 'temperature',
    label: 'Temperatura (C)',
    type: 'number',
    target: 'vitals',
    min: 0,
    step: '0.1'
  },
  {
    key: 'primary_diagnosis',
    label: 'Impresion diagnostica principal',
    type: 'text',
    target: 'payload'
  },
  {
    key: 'followup_days',
    label: 'Seguimiento (dias)',
    type: 'number',
    target: 'payload',
    min: 0
  },
  {
    key: 'study_requests',
    label: 'Estudios solicitados',
    type: 'textarea',
    target: 'payload',
    placeholder: 'Laboratorio, imagenes o estudios funcionales.'
  }
];

export const SPECIALTY_FIELD_TEMPLATES: Record<string, SpecialtyFieldDefinition[]> = {
  cardiology: [
    {
      key: 'systolic_bp',
      label: 'Presion sistolica',
      type: 'number',
      target: 'vitals',
      min: 0
    },
    {
      key: 'diastolic_bp',
      label: 'Presion diastolica',
      type: 'number',
      target: 'vitals',
      min: 0
    },
    {
      key: 'heart_rate',
      label: 'Frecuencia cardiaca (bpm)',
      type: 'number',
      target: 'vitals',
      min: 0
    },
    {
      key: 'cholesterol_total',
      label: 'Colesterol total',
      type: 'number',
      target: 'vitals',
      min: 0
    },
    {
      key: 'risk_class',
      label: 'Riesgo cardiovascular',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'low', label: 'Bajo' },
        { value: 'medium', label: 'Medio' },
        { value: 'high', label: 'Alto' }
      ]
    },
    {
      key: 'ldl_hdl_ratio',
      label: 'Relacion LDL/HDL',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'ecg_summary',
      label: 'Resumen ECG / Hallazgos',
      type: 'textarea',
      target: 'payload'
    }
  ],
  pediatrics: [
    {
      key: 'weight_kg',
      label: 'Peso (kg)',
      type: 'number',
      target: 'vitals',
      min: 0,
      step: '0.01'
    },
    {
      key: 'height_cm',
      label: 'Altura (cm)',
      type: 'number',
      target: 'vitals',
      min: 0,
      step: '0.1'
    },
    {
      key: 'temperature',
      label: 'Temperatura (C)',
      type: 'number',
      target: 'vitals',
      min: 0,
      step: '0.1'
    },
    {
      key: 'vaccine_status',
      label: 'Estado de vacunacion',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'up_to_date', label: 'Al dia' },
        { value: 'delayed', label: 'Atrasado' }
      ]
    },
    {
      key: 'development_milestone',
      label: 'Hito de desarrollo',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'feeding_type',
      label: 'Tipo de alimentacion',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'pediatric_alerts',
      label: 'Alertas pediatricas',
      type: 'textarea',
      target: 'payload'
    }
  ],
  gynecology: [
    {
      key: 'last_menstrual_period',
      label: 'FUM (ultima menstruacion)',
      type: 'date',
      target: 'payload'
    },
    {
      key: 'pregnancy_status',
      label: 'Estado de embarazo',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'no', label: 'No' },
        { value: 'suspected', label: 'Sospecha' },
        { value: 'confirmed', label: 'Confirmado' }
      ]
    },
    {
      key: 'contraceptive_method',
      label: 'Metodo anticonceptivo',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'pap_smear_result',
      label: 'Resultado PAP',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'breast_exam',
      label: 'Examen mamario',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'gynecology_plan',
      label: 'Plan ginecologico',
      type: 'textarea',
      target: 'payload'
    }
  ],
  traumatology: [
    {
      key: 'pain_scale',
      label: 'Escala de dolor (0-10)',
      type: 'number',
      target: 'payload',
      min: 0,
      step: '1'
    },
    {
      key: 'injured_region',
      label: 'Region afectada',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'mobility_grade',
      label: 'Movilidad funcional',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'conserved', label: 'Conservada' },
        { value: 'limited', label: 'Limitada' },
        { value: 'severe', label: 'Severamente limitada' }
      ]
    },
    {
      key: 'fracture_suspected',
      label: 'Sospecha de fractura',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Si' }
      ]
    },
    {
      key: 'rehab_plan',
      label: 'Plan de rehabilitacion',
      type: 'textarea',
      target: 'payload'
    }
  ],
  neurology: [
    {
      key: 'glasgow_scale',
      label: 'Escala de Glasgow',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'seizure_history',
      label: 'Antecedente de convulsiones',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Si' }
      ]
    },
    {
      key: 'focal_deficit',
      label: 'Deficit focal',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'cognitive_status',
      label: 'Estado cognitivo',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'neuro_exam_notes',
      label: 'Notas del examen neurologico',
      type: 'textarea',
      target: 'payload'
    }
  ],
  'internal-medicine': [
    {
      key: 'blood_glucose',
      label: 'Glucemia',
      type: 'number',
      target: 'vitals',
      min: 0
    },
    {
      key: 'blood_pressure',
      label: 'Presion arterial',
      type: 'text',
      target: 'vitals'
    },
    {
      key: 'chronic_conditions',
      label: 'Condiciones cronicas',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'current_medication',
      label: 'Medicacion actual',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'risk_factors',
      label: 'Factores de riesgo',
      type: 'textarea',
      target: 'payload'
    }
  ],
  dermatology: [
    {
      key: 'lesion_location',
      label: 'Ubicacion de lesion',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'lesion_type',
      label: 'Tipo de lesion',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'macula', label: 'Macula' },
        { value: 'papula', label: 'Papula' },
        { value: 'placa', label: 'Placa' },
        { value: 'ulcera', label: 'Ulcera' }
      ]
    },
    {
      key: 'lesion_size_mm',
      label: 'Tamano lesion (mm)',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'dermatoscopy_notes',
      label: 'Notas de dermatoscopia',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'topical_treatment',
      label: 'Tratamiento topico',
      type: 'text',
      target: 'payload'
    }
  ],
  endocrinology: [
    {
      key: 'blood_glucose',
      label: 'Glucemia',
      type: 'number',
      target: 'vitals',
      min: 0
    },
    {
      key: 'hba1c',
      label: 'HbA1c (%)',
      type: 'number',
      target: 'payload',
      min: 0,
      step: '0.1'
    },
    {
      key: 'tsh',
      label: 'TSH',
      type: 'number',
      target: 'payload',
      min: 0,
      step: '0.01'
    },
    {
      key: 'bmi',
      label: 'IMC',
      type: 'number',
      target: 'vitals',
      min: 0,
      step: '0.1'
    },
    {
      key: 'endocrine_plan',
      label: 'Plan endocrinologico',
      type: 'textarea',
      target: 'payload'
    }
  ],
  gastroenterology: [
    {
      key: 'abdominal_pain_scale',
      label: 'Dolor abdominal (0-10)',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'stool_pattern',
      label: 'Patron evacuatorio',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'constipation', label: 'Estrenimiento' },
        { value: 'diarrhea', label: 'Diarrea' },
        { value: 'alternating', label: 'Alternante' }
      ]
    },
    {
      key: 'digestive_symptoms',
      label: 'Sintomas digestivos',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'endoscopy_required',
      label: 'Requiere endoscopia',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Si' }
      ]
    },
    {
      key: 'digestive_plan',
      label: 'Plan digestivo',
      type: 'textarea',
      target: 'payload'
    }
  ],
  pulmonology: [
    {
      key: 'spo2',
      label: 'Saturacion O2 (%)',
      type: 'number',
      target: 'vitals',
      min: 0
    },
    {
      key: 'respiratory_rate',
      label: 'Frecuencia respiratoria',
      type: 'number',
      target: 'vitals',
      min: 0
    },
    {
      key: 'cough_type',
      label: 'Tipo de tos',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'none', label: 'Sin tos' },
        { value: 'dry', label: 'Seca' },
        { value: 'productive', label: 'Productiva' }
      ]
    },
    {
      key: 'dyspnea_scale',
      label: 'Escala de disnea',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'inhaler_plan',
      label: 'Plan inhalatorio',
      type: 'textarea',
      target: 'payload'
    }
  ],
  urology: [
    {
      key: 'urinary_frequency',
      label: 'Frecuencia urinaria',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'increased', label: 'Aumentada' },
        { value: 'decreased', label: 'Disminuida' }
      ]
    },
    {
      key: 'hematuria',
      label: 'Hematuria',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Si' }
      ]
    },
    {
      key: 'prostate_symptoms',
      label: 'Sintomas prostáticos',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'urinalysis_summary',
      label: 'Resumen de uroanalisis',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'urology_plan',
      label: 'Plan urologico',
      type: 'textarea',
      target: 'payload'
    }
  ],
  nephrology: [
    {
      key: 'creatinine',
      label: 'Creatinina',
      type: 'number',
      target: 'payload',
      min: 0,
      step: '0.01'
    },
    {
      key: 'egfr',
      label: 'TFG estimada',
      type: 'number',
      target: 'payload',
      min: 0,
      step: '0.1'
    },
    {
      key: 'proteinuria',
      label: 'Proteinuria',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'negative', label: 'Negativa' },
        { value: 'trace', label: 'Trazas' },
        { value: 'positive', label: 'Positiva' }
      ]
    },
    {
      key: 'edema_grade',
      label: 'Grado de edema',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'none', label: 'Sin edema' },
        { value: 'mild', label: 'Leve' },
        { value: 'moderate', label: 'Moderado' },
        { value: 'severe', label: 'Severo' }
      ]
    },
    {
      key: 'renal_plan',
      label: 'Plan nefrologico',
      type: 'textarea',
      target: 'payload'
    }
  ],
  oncology: [
    {
      key: 'staging',
      label: 'Estadio oncologico',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'treatment_phase',
      label: 'Fase de tratamiento',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'diagnosis', label: 'Diagnostico' },
        { value: 'active', label: 'Tratamiento activo' },
        { value: 'maintenance', label: 'Mantenimiento' },
        { value: 'palliative', label: 'Paliativo' }
      ]
    },
    {
      key: 'pain_scale',
      label: 'Dolor (0-10)',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'toxicity_grade',
      label: 'Grado de toxicidad',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'g0', label: 'G0' },
        { value: 'g1', label: 'G1' },
        { value: 'g2', label: 'G2' },
        { value: 'g3', label: 'G3' },
        { value: 'g4', label: 'G4' }
      ]
    },
    {
      key: 'oncology_plan',
      label: 'Plan oncologico',
      type: 'textarea',
      target: 'payload'
    }
  ],
  otolaryngology: [
    {
      key: 'affected_area',
      label: 'Area afectada',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'ear', label: 'Oido' },
        { value: 'nose', label: 'Nariz' },
        { value: 'throat', label: 'Garganta' },
        { value: 'multiple', label: 'Multiple' }
      ]
    },
    {
      key: 'hearing_loss',
      label: 'Hipoacusia',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Si' }
      ]
    },
    {
      key: 'vestibular_symptoms',
      label: 'Sintomas vestibulares',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Si' }
      ]
    },
    {
      key: 'throat_findings',
      label: 'Hallazgos faringeos',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'ent_plan',
      label: 'Plan ORL',
      type: 'textarea',
      target: 'payload'
    }
  ],
  ophthalmology: [
    {
      key: 'visual_acuity_od',
      label: 'Agudeza visual OD',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'visual_acuity_oi',
      label: 'Agudeza visual OI',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'intraocular_pressure_od',
      label: 'PIO OD',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'intraocular_pressure_oi',
      label: 'PIO OI',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'fundus_notes',
      label: 'Notas de fondo de ojo',
      type: 'textarea',
      target: 'payload'
    }
  ],
  rheumatology: [
    {
      key: 'joint_count',
      label: 'Articulaciones comprometidas',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'morning_stiffness_min',
      label: 'Rigidez matinal (min)',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'inflammatory_markers',
      label: 'Marcadores inflamatorios',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'autoimmune_profile',
      label: 'Perfil autoinmune',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'rheuma_plan',
      label: 'Plan reumatologico',
      type: 'textarea',
      target: 'payload'
    }
  ],
  infectology: [
    {
      key: 'fever_c',
      label: 'Temperatura (C)',
      type: 'number',
      target: 'vitals',
      min: 0,
      step: '0.1'
    },
    {
      key: 'suspected_pathogen',
      label: 'Agente sospechado',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'infection_focus',
      label: 'Foco infeccioso',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'isolation_needed',
      label: 'Requiere aislamiento',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Si' }
      ]
    },
    {
      key: 'antimicrobial_plan',
      label: 'Plan antimicrobiano',
      type: 'textarea',
      target: 'payload'
    }
  ],
  nutrition: [
    {
      key: 'weight_kg',
      label: 'Peso (kg)',
      type: 'number',
      target: 'vitals',
      min: 0,
      step: '0.01'
    },
    {
      key: 'bmi',
      label: 'IMC',
      type: 'number',
      target: 'vitals',
      min: 0,
      step: '0.1'
    },
    {
      key: 'body_fat_pct',
      label: 'Grasa corporal (%)',
      type: 'number',
      target: 'payload',
      min: 0,
      step: '0.1'
    },
    {
      key: 'nutrition_goal',
      label: 'Objetivo nutricional',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'meal_plan',
      label: 'Plan alimentario',
      type: 'textarea',
      target: 'payload'
    }
  ],
  physiotherapy: [
    {
      key: 'pain_scale',
      label: 'Dolor (0-10)',
      type: 'number',
      target: 'payload',
      min: 0
    },
    {
      key: 'mobility_level',
      label: 'Nivel de movilidad',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'independent', label: 'Independiente' },
        { value: 'assisted', label: 'Asistida' },
        { value: 'dependent', label: 'Dependiente' }
      ]
    },
    {
      key: 'session_objective',
      label: 'Objetivo de sesion',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'exercises',
      label: 'Ejercicios indicados',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'physio_plan',
      label: 'Plan fisioterapeutico',
      type: 'textarea',
      target: 'payload'
    }
  ],
  nursing: [
    {
      key: 'nursing_diagnosis',
      label: 'Diagnostico de enfermeria',
      type: 'text',
      target: 'payload'
    },
    {
      key: 'care_priority',
      label: 'Prioridad de cuidado',
      type: 'select',
      target: 'payload',
      options: [
        { value: 'low', label: 'Baja' },
        { value: 'medium', label: 'Media' },
        { value: 'high', label: 'Alta' }
      ]
    },
    {
      key: 'medication_administered',
      label: 'Medicacion administrada',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'shift_observations',
      label: 'Observaciones de turno',
      type: 'textarea',
      target: 'payload'
    },
    {
      key: 'incident_report',
      label: 'Incidentes / alertas',
      type: 'textarea',
      target: 'payload'
    }
  ],
  'general-medicine': DEFAULT_SPECIALTY_FIELDS
};

const PROFESSIONAL_SPECIALTY_BOARD_SECTIONS: Record<string, SpecialtyBoardSectionConfig[]> = {
  'general-medicine': [
    {
      title: 'Control clínico general',
      description: 'Variables básicas y orientación diagnóstica del último contacto.',
      fieldKeys: ['blood_pressure', 'heart_rate', 'temperature']
    },
    {
      title: 'Conducta',
      description: 'Impresión clínica, seguimiento y estudios solicitados.',
      fieldKeys: ['primary_diagnosis', 'followup_days', 'study_requests']
    }
  ],
  cardiology: [
    {
      title: 'Hemodinámica',
      description: 'Variables cardiovasculares y clase funcional del último control.',
      fieldKeys: ['systolic_bp', 'diastolic_bp', 'heart_rate', 'risk_class']
    },
    {
      title: 'Seguimiento cardiológico',
      description: 'Hallazgos y criterios de monitoreo más recientes.',
      fieldKeys: ['cholesterol_total', 'ldl_hdl_ratio', 'ecg_summary']
    }
  ],
  pediatrics: [
    {
      title: 'Crecimiento',
      description: 'Peso, talla y control global del desarrollo pediátrico.',
      fieldKeys: ['weight_kg', 'height_cm', 'development_milestone']
    },
    {
      title: 'Cuidados y prevención',
      description: 'Vacunación, alimentación y alertas para seguimiento.',
      fieldKeys: ['vaccine_status', 'feeding_type', 'pediatric_alerts']
    }
  ],
  gynecology: [
    {
      title: 'Contexto gineco-obstétrico',
      description: 'Situación reproductiva y controles de referencia.',
      fieldKeys: ['last_menstrual_period', 'pregnancy_status', 'contraceptive_method']
    },
    {
      title: 'Tamizaje y plan',
      description: 'Hallazgos preventivos y plan clínico del módulo.',
      fieldKeys: ['pap_smear_result', 'breast_exam', 'gynecology_plan']
    }
  ],
  traumatology: [
    {
      title: 'Lesión y dolor',
      description: 'Ubicación, severidad y sospecha estructural reciente.',
      fieldKeys: ['injured_region', 'pain_scale', 'fracture_suspected']
    },
    {
      title: 'Funcionalidad',
      description: 'Estado de movilidad y orientación terapéutica.',
      fieldKeys: ['mobility_grade', 'trauma_mechanism', 'traumatology_plan']
    }
  ],
  neurology: [
    {
      title: 'Estado neurológico',
      description: 'Glasgow, déficit focal y contexto neurocognitivo reciente.',
      fieldKeys: ['glasgow_scale', 'focal_deficit', 'cognitive_status']
    },
    {
      title: 'Seguimiento neurológico',
      description: 'Crisis previas y hallazgos del examen clínico.',
      fieldKeys: ['seizure_history', 'neuro_exam_notes']
    }
  ],
  'internal-medicine': [
    {
      title: 'Control del paciente complejo',
      description: 'Glucemia, presión y carga de comorbilidades actuales.',
      fieldKeys: ['blood_glucose', 'blood_pressure', 'chronic_conditions']
    },
    {
      title: 'Conciliación terapéutica',
      description: 'Tratamientos vigentes y factores de riesgo del seguimiento.',
      fieldKeys: ['current_medication', 'risk_factors']
    }
  ],
  dermatology: [
    {
      title: 'Caracterización de lesiones',
      description: 'Topografía, tipo y tamaño del hallazgo cutáneo más reciente.',
      fieldKeys: ['lesion_location', 'lesion_type', 'lesion_size_mm']
    },
    {
      title: 'Evaluación dermatológica',
      description: 'Hallazgos de dermatoscopía y manejo tópico actual.',
      fieldKeys: ['dermatoscopy_notes', 'topical_treatment']
    }
  ],
  endocrinology: [
    {
      title: 'Control metabólico',
      description: 'Glucemia, HbA1c e IMC del último control endocrino.',
      fieldKeys: ['blood_glucose', 'hba1c', 'bmi']
    },
    {
      title: 'Eje endocrino',
      description: 'Función tiroidea y plan clínico vigente.',
      fieldKeys: ['tsh', 'endocrine_plan']
    }
  ],
  gastroenterology: [
    {
      title: 'Síntomas digestivos',
      description: 'Dolor abdominal, patrón evacuatorio y síntomas predominantes.',
      fieldKeys: ['abdominal_pain_scale', 'stool_pattern', 'digestive_symptoms']
    },
    {
      title: 'Estudios y plan',
      description: 'Necesidad de endoscopía y estrategia clínica actual.',
      fieldKeys: ['endoscopy_required', 'digestive_plan']
    }
  ],
  pulmonology: [
    {
      title: 'Estado respiratorio',
      description: 'Saturación, frecuencia respiratoria y patrón clínico reciente.',
      fieldKeys: ['spo2', 'respiratory_rate', 'cough_type']
    },
    {
      title: 'Soporte y control',
      description: 'Disnea reportada y plan de manejo inhalatorio.',
      fieldKeys: ['dyspnea_scale', 'inhaler_plan']
    }
  ],
  urology: [
    {
      title: 'Síntomas urinarios',
      description: 'Frecuencia, hematuria y síntomas prostáticos recientes.',
      fieldKeys: ['urinary_frequency', 'hematuria', 'prostate_symptoms']
    },
    {
      title: 'Estudios y conducta',
      description: 'Resumen analítico y plan del control urológico.',
      fieldKeys: ['urinalysis_summary', 'urology_plan']
    }
  ],
  nephrology: [
    {
      title: 'Función renal',
      description: 'Creatinina, TFG y proteinuria del último control.',
      fieldKeys: ['creatinine', 'egfr', 'proteinuria']
    },
    {
      title: 'Estado clínico',
      description: 'Edema y plan renal vigente.',
      fieldKeys: ['edema_grade', 'renal_plan']
    }
  ],
  oncology: [
    {
      title: 'Estado oncológico',
      description: 'Estadio, fase terapéutica y carga sintomática reciente.',
      fieldKeys: ['staging', 'treatment_phase', 'pain_scale']
    },
    {
      title: 'Toxicidad y plan',
      description: 'Tolerancia al tratamiento y conducta del módulo.',
      fieldKeys: ['toxicity_grade', 'oncology_plan']
    }
  ],
  otolaryngology: [
    {
      title: 'Área ORL',
      description: 'Región comprometida y síntomas funcionales asociados.',
      fieldKeys: ['affected_area', 'hearing_loss', 'vestibular_symptoms']
    },
    {
      title: 'Hallazgos de control',
      description: 'Evaluación faringea y plan ORL del último encuentro.',
      fieldKeys: ['throat_findings', 'ent_plan']
    }
  ],
  ophthalmology: [
    {
      title: 'Agudeza visual',
      description: 'Comparativo de visión binocular del último control.',
      fieldKeys: ['visual_acuity_od', 'visual_acuity_oi']
    },
    {
      title: 'Presión y fondo de ojo',
      description: 'Presión intraocular y hallazgos retinianos documentados.',
      fieldKeys: ['intraocular_pressure_od', 'intraocular_pressure_oi', 'fundus_notes']
    }
  ],
  rheumatology: [
    {
      title: 'Actividad reumatológica',
      description: 'Carga articular y rigidez de la última evaluación.',
      fieldKeys: ['joint_count', 'morning_stiffness_min']
    },
    {
      title: 'Perfil inflamatorio',
      description: 'Laboratorio, autoinmunidad y plan clínico actual.',
      fieldKeys: ['inflammatory_markers', 'autoimmune_profile', 'rheuma_plan']
    }
  ],
  infectology: [
    {
      title: 'Estado infeccioso',
      description: 'Temperatura, agente sospechado y foco clínico probable.',
      fieldKeys: ['fever_c', 'suspected_pathogen', 'infection_focus']
    },
    {
      title: 'Bioseguridad y plan',
      description: 'Aislamiento y esquema antimicrobiano en curso.',
      fieldKeys: ['isolation_needed', 'antimicrobial_plan']
    }
  ],
  nutrition: [
    {
      title: 'Composición corporal',
      description: 'Peso, IMC y porcentaje graso del último control.',
      fieldKeys: ['weight_kg', 'bmi', 'body_fat_pct']
    },
    {
      title: 'Objetivos nutricionales',
      description: 'Meta actual y plan alimentario indicado.',
      fieldKeys: ['nutrition_goal', 'meal_plan']
    }
  ],
  physiotherapy: [
    {
      title: 'Dolor y movilidad',
      description: 'Estado funcional y limitaciones de la sesión reciente.',
      fieldKeys: ['pain_scale', 'mobility_level']
    },
    {
      title: 'Rehabilitación',
      description: 'Objetivos, ejercicios y plan fisioterapéutico.',
      fieldKeys: ['session_objective', 'exercises', 'physio_plan']
    }
  ],
  nursing: [
    {
      title: 'Cuidados del turno',
      description: 'Diagnóstico, prioridad y medicación administrada.',
      fieldKeys: ['nursing_diagnosis', 'care_priority', 'medication_administered']
    },
    {
      title: 'Observaciones y alertas',
      description: 'Incidencias y continuidad del cuidado documentado.',
      fieldKeys: ['shift_observations', 'incident_report']
    }
  ]
};

export function isProfessionalLegacyModule(moduleKey?: string | null): boolean {
  return Boolean(moduleKey) && LEGACY_SPECIALTY_MODULES.has(String(moduleKey));
}

export function resolveProfessionalSpecialtyFields(
  moduleKey?: string | null,
): SpecialtyFieldDefinition[] {
  const normalizedKey = String(moduleKey || 'general-medicine').trim();
  return SPECIALTY_FIELD_TEMPLATES[normalizedKey] || DEFAULT_SPECIALTY_FIELDS;
}

function formatInsightValue(
  value: unknown,
  options?: Array<{ value: string; label: string }>,
): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  const option = options?.find((item) => item.value === normalized);
  if (option) {
    return option.label;
  }

  if (normalized === 'yes') {
    return 'Sí';
  }
  if (normalized === 'no') {
    return 'No';
  }
  if (normalized === 'open') {
    return 'Abierto';
  }
  if (normalized === 'in_progress') {
    return 'En progreso';
  }
  if (normalized === 'closed') {
    return 'Cerrado';
  }

  return normalized;
}

export function buildProfessionalSpecialtyInsightCards(
  moduleKey: string | null | undefined,
  encounters: SpecialtyEncounterLike[],
): SpecialtyInsightCard[] {
  if (!encounters.length) {
    return [];
  }

  const fields = resolveProfessionalSpecialtyFields(moduleKey);
  const sortedEncounters = [...encounters].sort((left, right) =>
    String(right.visit_date || '').localeCompare(String(left.visit_date || ''))
  );
  const latestEncounter = sortedEncounters[0];
  const activeCases = encounters.filter((encounter) => encounter.status !== 'closed').length;
  const cards: SpecialtyInsightCard[] = [
    {
      label: 'Casos activos',
      value: String(activeCases),
      description: 'Consultas abiertas o en seguimiento en tu especialidad.',
    },
  ];

  const latestFocus = latestEncounter.diagnosis || latestEncounter.chief_complaint;
  if (latestFocus) {
    cards.push({
      label: 'Último foco clínico',
      value: latestFocus,
      description: 'Resumen del último caso asistencial registrado.',
    });
  }

  for (const field of fields) {
    const rawValue =
      field.target === 'vitals'
        ? latestEncounter.vitals?.[field.key]
        : latestEncounter.payload?.[field.key];
    const formattedValue = formatInsightValue(rawValue, field.options);
    if (!formattedValue) {
      continue;
    }

    cards.push({
      label: field.label,
      value: formattedValue,
      description: 'Dato clínico más reciente capturado en el módulo.',
    });

    if (cards.length >= 4) {
      break;
    }
  }

  return cards.slice(0, 4);
}

function findProfessionalFieldDefinition(
  moduleKey: string | null | undefined,
  fieldKey: string,
): SpecialtyFieldDefinition | null {
  const fields = resolveProfessionalSpecialtyFields(moduleKey);
  return fields.find((field) => field.key === fieldKey) || null;
}

export function buildProfessionalSpecialtyBoardSections(
  moduleKey: string | null | undefined,
  encounters: SpecialtyEncounterLike[],
): SpecialtyBoardSectionView[] {
  const normalizedKey = String(moduleKey || '').trim().toLowerCase();
  const sectionConfig = PROFESSIONAL_SPECIALTY_BOARD_SECTIONS[normalizedKey];
  if (!sectionConfig?.length || !encounters.length) {
    return [];
  }

  const latestEncounter = [...encounters].sort((left, right) =>
    String(right.visit_date || '').localeCompare(String(left.visit_date || ''))
  )[0];

  return sectionConfig
    .map((section) => {
      const items = section.fieldKeys
        .map((fieldKey) => {
          const fieldDefinition = findProfessionalFieldDefinition(moduleKey, fieldKey);
          if (!fieldDefinition) {
            return null;
          }

          const rawValue =
            fieldDefinition.target === 'vitals'
              ? latestEncounter.vitals?.[fieldKey]
              : latestEncounter.payload?.[fieldKey];
          const formattedValue = formatInsightValue(rawValue, fieldDefinition.options);
          if (!formattedValue) {
            return null;
          }

          return {
            label: fieldDefinition.label,
            value: formattedValue
          };
        })
        .filter((item): item is SpecialtyBoardFieldValue => Boolean(item));

      if (!items.length) {
        return null;
      }

      return {
        title: section.title,
        description: section.description,
        items
      };
    })
    .filter((item): item is SpecialtyBoardSectionView => Boolean(item));
}

export function resolveProfessionalSpecialtyPrimaryQuickAction(
  moduleKey: string | null | undefined,
): SpecialtyPrimaryQuickAction | null {
  const normalizedKey = String(moduleKey || '').trim().toLowerCase();
  if (normalizedKey === 'odontology') {
    return {
      label: 'Ir a Odontología',
      route: '/odontology'
    };
  }

  if (normalizedKey === 'psychology' || normalizedKey === 'psychopedagogy') {
    return {
      label: 'Ir a Salud Mental',
      route: '/mental-health'
    };
  }

  return null;
}
