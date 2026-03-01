import {
  PatientOdontogram,
  PatientOdontogramTooth,
  PatientSpecialtyHistory,
} from '../core/services/patient-api.service';

type SpecialtyValueSource = 'payload' | 'vitals';

type SpecialtyFieldConfig = {
  key: string;
  label: string;
  source?: SpecialtyValueSource;
};

type SpecialtySectionConfig = {
  title: string;
  description: string;
  fields: SpecialtyFieldConfig[];
};

export interface PatientSpecialtyBoardItem {
  label: string;
  value: string;
}

export interface PatientSpecialtyBoardSectionView {
  title: string;
  description: string;
  items: PatientSpecialtyBoardItem[];
}

type SpecialtyEncounterLike = NonNullable<PatientSpecialtyHistory['specialty_encounters']>[number];

const SECTION_CONFIG: Record<string, SpecialtySectionConfig[]> = {
  'general-medicine': [
    {
      title: 'Control clínico general',
      description: 'Variables básicas y seguimiento del último control.',
      fields: [
        { key: 'blood_pressure', label: 'Presión arterial', source: 'vitals' },
        { key: 'heart_rate', label: 'Frecuencia cardiaca', source: 'vitals' },
        { key: 'temperature', label: 'Temperatura', source: 'vitals' },
      ],
    },
    {
      title: 'Conducta',
      description: 'Impresión diagnóstica y estudios solicitados.',
      fields: [
        { key: 'primary_diagnosis', label: 'Impresión diagnóstica' },
        { key: 'followup_days', label: 'Seguimiento (días)' },
        { key: 'study_requests', label: 'Estudios solicitados' },
      ],
    },
  ],
  cardiology: [
    {
      title: 'Hemodinámica',
      description: 'Datos cardiovasculares del último control.',
      fields: [
        { key: 'systolic_bp', label: 'Presión sistólica', source: 'vitals' },
        { key: 'diastolic_bp', label: 'Presión diastólica', source: 'vitals' },
        { key: 'heart_rate', label: 'Frecuencia cardiaca', source: 'vitals' },
        { key: 'risk_class', label: 'Riesgo cardiovascular' },
      ],
    },
    {
      title: 'Seguimiento',
      description: 'Hallazgos del último control cardiológico.',
      fields: [
        { key: 'cholesterol_total', label: 'Colesterol total', source: 'vitals' },
        { key: 'ldl_hdl_ratio', label: 'Relación LDL/HDL' },
        { key: 'ecg_summary', label: 'Resumen ECG' },
      ],
    },
  ],
  pediatrics: [
    {
      title: 'Crecimiento',
      description: 'Peso, talla y desarrollo del último control.',
      fields: [
        { key: 'weight_kg', label: 'Peso', source: 'vitals' },
        { key: 'height_cm', label: 'Altura', source: 'vitals' },
        { key: 'development_milestone', label: 'Hito de desarrollo' },
      ],
    },
    {
      title: 'Prevención',
      description: 'Vacunación, alimentación y alertas.',
      fields: [
        { key: 'vaccine_status', label: 'Vacunación' },
        { key: 'feeding_type', label: 'Alimentación' },
        { key: 'pediatric_alerts', label: 'Alertas' },
      ],
    },
  ],
  gynecology: [
    {
      title: 'Contexto gineco-obstétrico',
      description: 'Datos del último control ginecológico.',
      fields: [
        { key: 'last_menstrual_period', label: 'FUM' },
        { key: 'pregnancy_status', label: 'Estado de embarazo' },
        { key: 'contraceptive_method', label: 'Método anticonceptivo' },
      ],
    },
    {
      title: 'Tamizaje y plan',
      description: 'Screening y conducta actual.',
      fields: [
        { key: 'pap_smear_result', label: 'PAP' },
        { key: 'breast_exam', label: 'Examen mamario' },
        { key: 'gynecology_plan', label: 'Plan ginecológico' },
      ],
    },
  ],
  traumatology: [
    {
      title: 'Lesión y dolor',
      description: 'Foco de lesión y estado funcional.',
      fields: [
        { key: 'injured_region', label: 'Región afectada' },
        { key: 'pain_scale', label: 'Dolor' },
        { key: 'fracture_suspected', label: 'Sospecha de fractura' },
      ],
    },
    {
      title: 'Recuperación',
      description: 'Movilidad y plan de rehabilitación.',
      fields: [
        { key: 'mobility_grade', label: 'Movilidad' },
        { key: 'rehab_plan', label: 'Plan de rehabilitación' },
      ],
    },
  ],
  neurology: [
    {
      title: 'Estado neurológico',
      description: 'Hallazgos principales del último control.',
      fields: [
        { key: 'glasgow_scale', label: 'Glasgow' },
        { key: 'focal_deficit', label: 'Déficit focal' },
        { key: 'cognitive_status', label: 'Estado cognitivo' },
      ],
    },
    {
      title: 'Seguimiento',
      description: 'Antecedentes de crisis y notas clínicas.',
      fields: [
        { key: 'seizure_history', label: 'Historia convulsiva' },
        { key: 'neuro_exam_notes', label: 'Notas del examen' },
      ],
    },
  ],
  'internal-medicine': [
    {
      title: 'Paciente complejo',
      description: 'Comorbilidades y variables principales.',
      fields: [
        { key: 'blood_glucose', label: 'Glucemia', source: 'vitals' },
        { key: 'blood_pressure', label: 'Presión arterial', source: 'vitals' },
        { key: 'chronic_conditions', label: 'Condiciones crónicas' },
      ],
    },
    {
      title: 'Factores de control',
      description: 'Tratamiento actual y factores de riesgo.',
      fields: [
        { key: 'current_medication', label: 'Medicación actual' },
        { key: 'risk_factors', label: 'Factores de riesgo' },
      ],
    },
  ],
  dermatology: [
    {
      title: 'Lesiones cutáneas',
      description: 'Caracterización de la lesión principal.',
      fields: [
        { key: 'lesion_location', label: 'Ubicación' },
        { key: 'lesion_type', label: 'Tipo de lesión' },
        { key: 'lesion_size_mm', label: 'Tamaño (mm)' },
      ],
    },
    {
      title: 'Conducta dermatológica',
      description: 'Hallazgos y tratamiento actual.',
      fields: [
        { key: 'dermatoscopy_notes', label: 'Dermatoscopía' },
        { key: 'topical_treatment', label: 'Tratamiento tópico' },
      ],
    },
  ],
  endocrinology: [
    {
      title: 'Control metabólico',
      description: 'Variables endocrinas recientes.',
      fields: [
        { key: 'blood_glucose', label: 'Glucemia', source: 'vitals' },
        { key: 'hba1c', label: 'HbA1c' },
        { key: 'bmi', label: 'IMC' },
      ],
    },
    {
      title: 'Seguimiento endocrino',
      description: 'Función tiroidea y plan actual.',
      fields: [
        { key: 'tsh', label: 'TSH' },
        { key: 'endocrine_plan', label: 'Plan endocrino' },
      ],
    },
  ],
  gastroenterology: [
    {
      title: 'Síntomas digestivos',
      description: 'Patrón clínico del último control.',
      fields: [
        { key: 'abdominal_pain_scale', label: 'Dolor abdominal' },
        { key: 'stool_pattern', label: 'Patrón evacuatorio' },
        { key: 'digestive_symptoms', label: 'Síntomas digestivos' },
      ],
    },
    {
      title: 'Estudios y plan',
      description: 'Próximos pasos diagnósticos y terapéuticos.',
      fields: [
        { key: 'endoscopy_required', label: 'Endoscopía requerida' },
        { key: 'digestive_plan', label: 'Plan digestivo' },
      ],
    },
  ],
  pulmonology: [
    {
      title: 'Estado respiratorio',
      description: 'Parámetros respiratorios del último control.',
      fields: [
        { key: 'spo2', label: 'Saturación O2', source: 'vitals' },
        { key: 'respiratory_rate', label: 'Frecuencia respiratoria', source: 'vitals' },
        { key: 'cough_type', label: 'Tipo de tos' },
      ],
    },
    {
      title: 'Manejo respiratorio',
      description: 'Escala de disnea y plan inhalatorio.',
      fields: [
        { key: 'dyspnea_scale', label: 'Disnea' },
        { key: 'inhaler_plan', label: 'Plan inhalatorio' },
      ],
    },
  ],
  urology: [
    {
      title: 'Síntomas urinarios',
      description: 'Hallazgos urológicos del último control.',
      fields: [
        { key: 'urinary_frequency', label: 'Frecuencia urinaria' },
        { key: 'hematuria', label: 'Hematuria' },
        { key: 'prostate_symptoms', label: 'Síntomas prostáticos' },
      ],
    },
    {
      title: 'Estudios y plan',
      description: 'Resumen analítico y conducta del módulo.',
      fields: [
        { key: 'urinalysis_summary', label: 'Uroanálisis' },
        { key: 'urology_plan', label: 'Plan urológico' },
      ],
    },
  ],
  nephrology: [
    {
      title: 'Función renal',
      description: 'Variables renales principales del último control.',
      fields: [
        { key: 'creatinine', label: 'Creatinina' },
        { key: 'egfr', label: 'TFG estimada' },
        { key: 'proteinuria', label: 'Proteinuria' },
      ],
    },
    {
      title: 'Seguimiento renal',
      description: 'Estado clínico y plan actual.',
      fields: [
        { key: 'edema_grade', label: 'Grado de edema' },
        { key: 'renal_plan', label: 'Plan renal' },
      ],
    },
  ],
  oncology: [
    {
      title: 'Estado oncológico',
      description: 'Fase actual y carga sintomática.',
      fields: [
        { key: 'staging', label: 'Estadio' },
        { key: 'treatment_phase', label: 'Fase de tratamiento' },
        { key: 'pain_scale', label: 'Dolor' },
      ],
    },
    {
      title: 'Toxicidad y plan',
      description: 'Tolerancia y estrategia terapéutica.',
      fields: [
        { key: 'toxicity_grade', label: 'Toxicidad' },
        { key: 'oncology_plan', label: 'Plan oncológico' },
      ],
    },
  ],
  otolaryngology: [
    {
      title: 'Área ORL',
      description: 'Compromiso funcional del último control.',
      fields: [
        { key: 'affected_area', label: 'Área afectada' },
        { key: 'hearing_loss', label: 'Hipoacusia' },
        { key: 'vestibular_symptoms', label: 'Síntomas vestibulares' },
      ],
    },
    {
      title: 'Conducta ORL',
      description: 'Hallazgos y plan actual del módulo.',
      fields: [
        { key: 'throat_findings', label: 'Hallazgos faríngeos' },
        { key: 'ent_plan', label: 'Plan ORL' },
      ],
    },
  ],
  ophthalmology: [
    {
      title: 'Agudeza visual',
      description: 'Comparativo del último control visual.',
      fields: [
        { key: 'visual_acuity_od', label: 'Agudeza OD' },
        { key: 'visual_acuity_oi', label: 'Agudeza OI' },
      ],
    },
    {
      title: 'Presión y retina',
      description: 'Presión intraocular y fondo de ojo.',
      fields: [
        { key: 'intraocular_pressure_od', label: 'PIO OD' },
        { key: 'intraocular_pressure_oi', label: 'PIO OI' },
        { key: 'fundus_notes', label: 'Fondo de ojo' },
      ],
    },
  ],
  rheumatology: [
    {
      title: 'Actividad reumatológica',
      description: 'Carga articular y rigidez recientes.',
      fields: [
        { key: 'joint_count', label: 'Conteo articular' },
        { key: 'morning_stiffness_min', label: 'Rigidez matinal' },
      ],
    },
    {
      title: 'Perfil inflamatorio',
      description: 'Laboratorio, autoinmunidad y plan del módulo.',
      fields: [
        { key: 'inflammatory_markers', label: 'Marcadores inflamatorios' },
        { key: 'autoimmune_profile', label: 'Perfil autoinmune' },
        { key: 'rheuma_plan', label: 'Plan reumatológico' },
      ],
    },
  ],
  infectology: [
    {
      title: 'Estado infeccioso',
      description: 'Temperatura, patógeno y foco sospechado.',
      fields: [
        { key: 'fever_c', label: 'Temperatura', source: 'vitals' },
        { key: 'suspected_pathogen', label: 'Patógeno sospechado' },
        { key: 'infection_focus', label: 'Foco infeccioso' },
      ],
    },
    {
      title: 'Bioseguridad',
      description: 'Necesidad de aislamiento y esquema antimicrobiano.',
      fields: [
        { key: 'isolation_needed', label: 'Aislamiento' },
        { key: 'antimicrobial_plan', label: 'Plan antimicrobiano' },
      ],
    },
  ],
  nutrition: [
    {
      title: 'Estado nutricional',
      description: 'Parámetros corporales del último control.',
      fields: [
        { key: 'weight_kg', label: 'Peso', source: 'vitals' },
        { key: 'bmi', label: 'IMC', source: 'vitals' },
        { key: 'body_fat_pct', label: 'Grasa corporal' },
      ],
    },
    {
      title: 'Objetivos y plan',
      description: 'Metas actuales y alimentación indicada.',
      fields: [
        { key: 'nutrition_goal', label: 'Objetivo nutricional' },
        { key: 'meal_plan', label: 'Plan alimentario' },
      ],
    },
  ],
  physiotherapy: [
    {
      title: 'Dolor y movilidad',
      description: 'Estado funcional del último control terapéutico.',
      fields: [
        { key: 'pain_scale', label: 'Dolor' },
        { key: 'mobility_level', label: 'Nivel de movilidad' },
      ],
    },
    {
      title: 'Sesión de rehabilitación',
      description: 'Objetivos y ejercicios indicados.',
      fields: [
        { key: 'session_objective', label: 'Objetivo de sesión' },
        { key: 'exercises', label: 'Ejercicios' },
        { key: 'physio_plan', label: 'Plan fisioterapéutico' },
      ],
    },
  ],
  nursing: [
    {
      title: 'Cuidados del turno',
      description: 'Diagnóstico, prioridad y medicación reciente.',
      fields: [
        { key: 'nursing_diagnosis', label: 'Diagnóstico de enfermería' },
        { key: 'care_priority', label: 'Prioridad' },
        { key: 'medication_administered', label: 'Medicación administrada' },
      ],
    },
    {
      title: 'Observaciones',
      description: 'Incidencias y continuidad del cuidado.',
      fields: [
        { key: 'shift_observations', label: 'Observaciones de turno' },
        { key: 'incident_report', label: 'Incidentes / alertas' },
      ],
    },
  ],
};

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  const labels: Record<string, string> = {
    yes: 'Sí',
    no: 'No',
    open: 'Abierto',
    in_progress: 'En progreso',
    closed: 'Cerrado',
    up_to_date: 'Al día',
    delayed: 'Atrasado',
    unknown: 'No documentado',
    low: 'Bajo',
    medium: 'Moderado',
    high: 'Alto',
    critical: 'Crítico',
    confirmed: 'Confirmado',
    suspected: 'Sospecha',
    negative: 'Negativa',
    positive: 'Positiva',
    trace: 'Trazas',
    mild: 'Leve',
    moderate: 'Moderado',
    severe: 'Severo',
    active: 'Tratamiento activo',
    maintenance: 'Mantenimiento',
    palliative: 'Paliativo',
    diagnosis: 'Diagnóstico',
    independent: 'Independiente',
    assisted: 'Asistida',
    dependent: 'Dependiente',
  };

  return labels[normalized] || normalized;
}

function getLatestEncounter(history: PatientSpecialtyHistory | null): SpecialtyEncounterLike | null {
  if (!history?.specialty_encounters?.length) {
    return null;
  }

  return [...history.specialty_encounters].sort((left, right) =>
    String(right.visit_date || '').localeCompare(String(left.visit_date || ''))
  )[0];
}

function readFieldValue(
  encounter: SpecialtyEncounterLike,
  field: SpecialtyFieldConfig,
): string | null {
  const source = field.source || 'payload';
  const rawValue =
    source === 'vitals'
      ? encounter.vitals?.[field.key]
      : encounter.payload?.[field.key];
  return normalizeValue(rawValue);
}

function countToothStatuses(teeth: PatientOdontogramTooth[]): Record<string, number> {
  return teeth.reduce<Record<string, number>>((accumulator, tooth) => {
    const key = String(tooth.status || 'healthy');
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function buildOdontologySections(odontogram: PatientOdontogram | null): PatientSpecialtyBoardSectionView[] {
  if (!odontogram?.teeth?.length) {
    return [];
  }

  const counts = countToothStatuses(odontogram.teeth);
  const plannedTreatments = Array.from(
    new Set(
      odontogram.teeth
        .map((tooth) => String(tooth.planned_treatment || '').trim())
        .filter(Boolean)
    )
  ).slice(0, 4);

  const sections: PatientSpecialtyBoardSectionView[] = [
    {
      title: 'Estado odontológico',
      description: 'Resumen de piezas registradas en el odontograma activo.',
      items: [
        { label: 'Sanos', value: String(counts.healthy || 0) },
        { label: 'Caries', value: String(counts.caries || 0) },
        { label: 'Restaurados', value: String(counts.filled || 0) },
        { label: 'Ausentes', value: String((counts.missing || 0) + (counts.extracted || 0)) },
      ],
    },
  ];

  if (plannedTreatments.length > 0) {
    sections.push({
      title: 'Tratamientos planificados',
      description: 'Conductas odontológicas registradas para próximas atenciones.',
      items: plannedTreatments.map((value, index) => ({
        label: `Plan ${index + 1}`,
        value,
      })),
    });
  }

  return sections;
}

export function buildPatientSpecialtyBoardSections(
  specialtyKey: string | null | undefined,
  history: PatientSpecialtyHistory | null,
  odontogram: PatientOdontogram | null,
): PatientSpecialtyBoardSectionView[] {
  const normalizedKey = String(specialtyKey || '').trim().toLowerCase();
  if (!normalizedKey) {
    return [];
  }

  if (normalizedKey === 'odontology') {
    return buildOdontologySections(odontogram);
  }

  const latestEncounter = getLatestEncounter(history);
  const sectionConfig = SECTION_CONFIG[normalizedKey];
  if (!latestEncounter || !sectionConfig?.length) {
    return [];
  }

  return sectionConfig
    .map((section) => {
      const items = section.fields
        .map((field) => {
          const value = readFieldValue(latestEncounter, field);
          if (!value) {
            return null;
          }
          return {
            label: field.label,
            value,
          };
        })
        .filter((item): item is PatientSpecialtyBoardItem => Boolean(item));

      if (!items.length) {
        return null;
      }

      return {
        title: section.title,
        description: section.description,
        items,
      };
    })
    .filter((item): item is PatientSpecialtyBoardSectionView => Boolean(item));
}
