export type SpecialtyFieldType = 'text' | 'textarea' | 'select' | 'number';

export const LEGACY_MODULES = new Set(['odontology', 'psychology', 'psychopedagogy']);

export interface SpecialtyFieldOption {
  value: string;
  label: string;
}

export interface SpecialtyFieldDefinition {
  key: string;
  label: string;
  type: SpecialtyFieldType;
  placeholder?: string;
  fullRow?: boolean;
  options?: SpecialtyFieldOption[];
}

export interface SpecialtyUiConfig {
  intakeTitle: string;
  chiefComplaintLabel: string;
  diagnosisLabel: string;
  assessmentLabel: string;
  planLabel: string;
  notesLabel: string;
  historyTitle: string;
  historyHint: string;
  briefTitle: string;
  moduleHighlights: string[];
  recommendedStudies: string[];
  followUpCadence: string;
  specialtyFields: SpecialtyFieldDefinition[];
}

export interface SpecialtyWorkspaceItem {
  title: string;
  description: string;
  route: string;
}

const SEVERITY_OPTIONS: SpecialtyFieldOption[] = [
  { value: 'low', label: 'Bajo' },
  { value: 'medium', label: 'Moderado' },
  { value: 'high', label: 'Alto' },
  { value: 'critical', label: 'Crítico' },
];

const YES_NO_OPTIONS: SpecialtyFieldOption[] = [
  { value: 'yes', label: 'Sí' },
  { value: 'no', label: 'No' },
];

const PAIN_SCALE_OPTIONS: SpecialtyFieldOption[] = Array.from({ length: 11 }).map((_, index) => ({
  value: String(index),
  label: `${index}/10`,
}));

const DEFAULT_UI_CONFIG: SpecialtyUiConfig = {
  intakeTitle: 'Nueva consulta clínica',
  chiefComplaintLabel: 'Motivo de consulta',
  diagnosisLabel: 'Diagnóstico',
  assessmentLabel: 'Evaluación',
  planLabel: 'Plan terapéutico',
  notesLabel: 'Notas',
  historyTitle: 'Atenciones registradas',
  historyHint: 'Historial de pacientes atendidos en este módulo.',
  briefTitle: 'Ruta clínica del módulo',
  moduleHighlights: [
    'Evaluación inicial y clasificación clínica.',
    'Diagnóstico diferencial y priorización.',
    'Plan terapéutico y monitoreo de respuesta.',
  ],
  recommendedStudies: [
    'Laboratorio base según cuadro clínico.',
    'Estudios complementarios según riesgo.',
    'Control evolutivo documentado en historial.',
  ],
  followUpCadence: 'Seguimiento en 7-30 días según severidad y evolución clínica.',
  specialtyFields: [
    { key: 'clinical_priority', label: 'Prioridad clínica', type: 'select', options: SEVERITY_OPTIONS },
    { key: 'risk_flags', label: 'Alertas clínicas', type: 'text', placeholder: 'riesgos o banderas rojas' },
    { key: 'followup_plan', label: 'Plan de seguimiento', type: 'textarea', fullRow: true },
  ],
};

const SPECIALTY_BRIEFS: Record<
  string,
  {
    briefTitle: string;
    moduleHighlights: string[];
    recommendedStudies: string[];
    followUpCadence: string;
  }
> = {
  'general-medicine': {
    briefTitle: 'Circuito de Medicina General',
    moduleHighlights: [
      'Primer contacto clínico y orientación diagnóstica.',
      'Control de comorbilidades frecuentes en atención primaria.',
      'Derivación coordinada a especialidades cuando corresponde.',
    ],
    recommendedStudies: [
      'Laboratorio general inicial.',
      'Perfil metabólico y cardiovascular básico.',
      'Control anual preventivo documentado.',
    ],
    followUpCadence: 'Control inicial en 7-14 días y seguimiento trimestral según riesgo.',
  },
  cardiology: {
    briefTitle: 'Circuito de Cardiología',
    moduleHighlights: [
      'Estratificación de riesgo cardiovascular.',
      'Manejo de HTA, insuficiencia y cardiopatías crónicas.',
      'Ajuste terapéutico basado en evolución clínica.',
    ],
    recommendedStudies: [
      'ECG y ecocardiograma según cuadro.',
      'Perfil lipídico y marcadores cardiometabólicos.',
      'Monitorización ambulatoria cuando aplique.',
    ],
    followUpCadence: 'Revisión en 7-30 días y control mensual en pacientes de alto riesgo.',
  },
  pediatrics: {
    briefTitle: 'Circuito Pediátrico',
    moduleHighlights: [
      'Control de crecimiento y desarrollo por edad.',
      'Seguimiento de vacunas y prevención.',
      'Educación familiar y alertas pediátricas.',
    ],
    recommendedStudies: [
      'Curvas de crecimiento y percentiles.',
      'Tamizajes pediátricos según edad.',
      'Laboratorio dirigido por síntomas.',
    ],
    followUpCadence: 'Controles mensuales o bimestrales según edad y condiciones clínicas.',
  },
  gynecology: {
    briefTitle: 'Circuito Gineco-Obstétrico',
    moduleHighlights: [
      'Evaluación integral de salud ginecológica.',
      'Prevención y tamizaje de patologías prevalentes.',
      'Seguimiento de salud sexual y reproductiva.',
    ],
    recommendedStudies: [
      'PAP/colposcopía según protocolo.',
      'Ecografía ginecológica/obstétrica.',
      'Perfil hormonal cuando indicado.',
    ],
    followUpCadence: 'Control en 4-12 semanas según hallazgos y plan terapéutico.',
  },
  traumatology: {
    briefTitle: 'Circuito Traumatológico',
    moduleHighlights: [
      'Evaluación mecánica de lesión y funcionalidad.',
      'Clasificación de severidad y manejo inicial.',
      'Coordinación con rehabilitación y control del dolor.',
    ],
    recommendedStudies: [
      'Radiografías segmentarias iniciales.',
      'RMN/TAC según sospecha estructural.',
      'Valoración funcional seriada.',
    ],
    followUpCadence: 'Primer control en 3-10 días y seguimiento semanal en fase aguda.',
  },
  neurology: {
    briefTitle: 'Circuito Neurológico',
    moduleHighlights: [
      'Detección de déficit focal y síndromes neurológicos.',
      'Control de crisis y trastornos neurológicos crónicos.',
      'Plan de neuroseguimiento y seguridad del paciente.',
    ],
    recommendedStudies: [
      'Neuroimagen según urgencia clínica.',
      'EEG y estudios neurofisiológicos.',
      'Escalas neurológicas seriadas.',
    ],
    followUpCadence: 'Control en 2-6 semanas o antes según progresión de síntomas.',
  },
  'internal-medicine': {
    briefTitle: 'Circuito de Medicina Interna',
    moduleHighlights: [
      'Manejo de paciente complejo y pluripatológico.',
      'Conciliación de tratamientos y reducción de riesgos.',
      'Coordinación multidisciplinaria de largo plazo.',
    ],
    recommendedStudies: [
      'Panel metabólico y renal/hepático completo.',
      'Estudios de control según comorbilidades.',
      'Revisión periódica de polifarmacia.',
    ],
    followUpCadence: 'Controles cada 2-8 semanas según estabilidad clínica.',
  },
  dermatology: {
    briefTitle: 'Circuito Dermatológico',
    moduleHighlights: [
      'Caracterización morfológica y topográfica de lesiones.',
      'Seguimiento terapéutico dermatológico.',
      'Prevención y vigilancia de lesiones de riesgo.',
    ],
    recommendedStudies: [
      'Dermatoscopía y registro fotográfico.',
      'Biopsia en lesiones sospechosas.',
      'Cultivos/estudios específicos según etiología.',
    ],
    followUpCadence: 'Control en 2-6 semanas según respuesta terapéutica.',
  },
  endocrinology: {
    briefTitle: 'Circuito Endocrinológico',
    moduleHighlights: [
      'Control metabólico y hormonal continuo.',
      'Ajuste terapéutico individualizado.',
      'Seguimiento de adherencia y objetivos clínicos.',
    ],
    recommendedStudies: [
      'HbA1c, perfil tiroideo y hormonal dirigido.',
      'Monitoreo de glucemia y peso.',
      'Marcadores de complicaciones crónicas.',
    ],
    followUpCadence: 'Revisión en 4-12 semanas según control metabólico.',
  },
  gastroenterology: {
    briefTitle: 'Circuito Gastroenterológico',
    moduleHighlights: [
      'Evaluación digestiva por patrón sintomático.',
      'Diferenciación entre cuadros funcionales y orgánicos.',
      'Seguimiento de respuesta y tolerancia terapéutica.',
    ],
    recommendedStudies: [
      'Laboratorio digestivo y hepatobiliar.',
      'Endoscopía según criterios clínicos.',
      'Imágenes abdominales dirigidas.',
    ],
    followUpCadence: 'Control en 2-8 semanas según severidad y diagnóstico.',
  },
  pulmonology: {
    briefTitle: 'Circuito Neumológico',
    moduleHighlights: [
      'Valoración respiratoria y saturación basal.',
      'Manejo de exacerbaciones y cronicidad.',
      'Optimización de terapia inhalatoria.',
    ],
    recommendedStudies: [
      'Espirometría y pruebas funcionales.',
      'Radiografía/TAC torácica según caso.',
      'Control de oximetría seriada.',
    ],
    followUpCadence: 'Seguimiento en 1-6 semanas según control respiratorio.',
  },
  urology: {
    briefTitle: 'Circuito Urológico',
    moduleHighlights: [
      'Evaluación de síntomas urinarios y urogenitales.',
      'Manejo clínico y vigilancia de factores de riesgo.',
      'Plan escalonado diagnóstico-terapéutico.',
    ],
    recommendedStudies: [
      'Uroanálisis y cultivos dirigidos.',
      'Ecografía urológica/prostática.',
      'PSA y estudios funcionales cuando aplique.',
    ],
    followUpCadence: 'Control en 2-8 semanas según hallazgos clínicos.',
  },
  nephrology: {
    briefTitle: 'Circuito Nefrológico',
    moduleHighlights: [
      'Control de función renal y balance hídrico.',
      'Prevención de progresión de enfermedad renal.',
      'Ajuste de tratamiento y riesgo cardiovascular renal.',
    ],
    recommendedStudies: [
      'TFG, creatinina y proteinuria seriada.',
      'Electrolitos y equilibrio ácido-base.',
      'Ecografía renal cuando indicado.',
    ],
    followUpCadence: 'Seguimiento en 2-6 semanas según estadio renal.',
  },
  oncology: {
    briefTitle: 'Circuito Oncológico',
    moduleHighlights: [
      'Registro por línea terapéutica y respuesta.',
      'Seguimiento de toxicidades y estado funcional.',
      'Continuidad asistencial multidisciplinaria.',
    ],
    recommendedStudies: [
      'Imágenes de estadificación/reestadificación.',
      'Marcadores tumorales según protocolo.',
      'Laboratorio pre y post tratamiento.',
    ],
    followUpCadence: 'Control cada ciclo terapéutico y reevaluación periódica oncológica.',
  },
  otolaryngology: {
    briefTitle: 'Circuito de Otorrinolaringología',
    moduleHighlights: [
      'Valoración ORL por región anatómica predominante.',
      'Manejo de patología de vía aérea superior.',
      'Seguimiento post tratamiento médico/procedimental.',
    ],
    recommendedStudies: [
      'Endoscopía nasal/laríngea según caso.',
      'Audiometría e impedanciometría.',
      'Imágenes ORL dirigidas.',
    ],
    followUpCadence: 'Control en 1-4 semanas según evolución clínica.',
  },
  ophthalmology: {
    briefTitle: 'Circuito Oftalmológico',
    moduleHighlights: [
      'Evaluación de agudeza visual y síntomas oculares.',
      'Monitoreo de presión intraocular y fondo de ojo.',
      'Plan terapéutico médico/quirúrgico escalonado.',
    ],
    recommendedStudies: [
      'Tonometría y fondo de ojo.',
      'Campimetría y OCT cuando corresponda.',
      'Registro visual comparativo seriado.',
    ],
    followUpCadence: 'Control en 1-12 semanas según riesgo oftalmológico.',
  },
  rheumatology: {
    briefTitle: 'Circuito Reumatológico',
    moduleHighlights: [
      'Medición de actividad inflamatoria articular.',
      'Ajuste de terapia inmunomoduladora.',
      'Seguimiento funcional y calidad de vida.',
    ],
    recommendedStudies: [
      'Marcadores inflamatorios seriados.',
      'Imágenes articulares específicas.',
      'Escalas de actividad clínica.',
    ],
    followUpCadence: 'Seguimiento cada 2-8 semanas según actividad inflamatoria.',
  },
  infectology: {
    briefTitle: 'Circuito Infectológico',
    moduleHighlights: [
      'Identificación de foco y severidad infecciosa.',
      'Optimización de antimicrobianos por evidencia.',
      'Vigilancia de respuesta y seguridad.',
    ],
    recommendedStudies: [
      'Cultivos y pruebas microbiológicas.',
      'Biomarcadores inflamatorios/infecciosos.',
      'Control de sensibilidad y desescalamiento.',
    ],
    followUpCadence: 'Reevaluación en 48-72h y seguimiento semanal según respuesta.',
  },
  nutrition: {
    briefTitle: 'Circuito Nutricional',
    moduleHighlights: [
      'Evaluación antropométrica y metabólica integral.',
      'Definición de objetivos por perfil clínico.',
      'Seguimiento de adherencia y cambios conductuales.',
    ],
    recommendedStudies: [
      'IMC y composición corporal.',
      'Perfil metabólico y micronutrientes.',
      'Registro alimentario evolutivo.',
    ],
    followUpCadence: 'Controles cada 2-6 semanas para ajuste de plan.',
  },
  physiotherapy: {
    briefTitle: 'Circuito de Fisioterapia',
    moduleHighlights: [
      'Evaluación funcional y movilidad.',
      'Plan de rehabilitación por objetivos medibles.',
      'Monitoreo de dolor y desempeño por sesión.',
    ],
    recommendedStudies: [
      'Escalas funcionales seriadas.',
      'Valoración de rango articular.',
      'Registro de respuesta a intervención.',
    ],
    followUpCadence: 'Sesiones 1-3 veces por semana según plan de rehabilitación.',
  },
  nursing: {
    briefTitle: 'Circuito de Enfermería',
    moduleHighlights: [
      'Valoración integral y cuidados continuos.',
      'Administración segura de medicación.',
      'Registro de signos, eventos y alertas clínicas.',
    ],
    recommendedStudies: [
      'Control periódico de signos vitales.',
      'Chequeo de adherencia terapéutica.',
      'Registro de incidencias y evolución.',
    ],
    followUpCadence: 'Seguimiento diario o por turno según nivel de cuidado.',
  },
};

const SPECIALTY_UI_CONFIG: Record<string, Partial<SpecialtyUiConfig>> = {
  'general-medicine': {
    intakeTitle: 'Nueva consulta de medicina general',
    chiefComplaintLabel: 'Motivo principal',
    diagnosisLabel: 'Impresión diagnóstica',
    assessmentLabel: 'Evaluación integral',
    planLabel: 'Plan de manejo',
    notesLabel: 'Observaciones médicas',
    historyTitle: 'Consultas de medicina general',
  },
  cardiology: {
    intakeTitle: 'Nueva valoración cardiológica',
    chiefComplaintLabel: 'Motivo cardiovascular',
    diagnosisLabel: 'Diagnóstico cardiológico',
    assessmentLabel: 'Estratificación de riesgo',
    planLabel: 'Plan cardiovascular',
    notesLabel: 'Indicaciones cardiología',
    historyTitle: 'Atenciones cardiológicas',
    specialtyFields: [
      { key: 'blood_pressure', label: 'Presión arterial', type: 'text', placeholder: '120/80' },
      { key: 'heart_rate', label: 'Frecuencia cardiaca (bpm)', type: 'number' },
      {
        key: 'functional_class',
        label: 'Clase funcional',
        type: 'select',
        options: [
          { value: 'I', label: 'Clase I' },
          { value: 'II', label: 'Clase II' },
          { value: 'III', label: 'Clase III' },
          { value: 'IV', label: 'Clase IV' },
        ],
      },
      { key: 'ecg_summary', label: 'Resumen ECG', type: 'textarea', fullRow: true },
    ],
  },
  pediatrics: {
    intakeTitle: 'Nuevo control pediátrico',
    chiefComplaintLabel: 'Motivo pediátrico',
    diagnosisLabel: 'Diagnóstico pediátrico',
    assessmentLabel: 'Evaluación crecimiento/desarrollo',
    planLabel: 'Plan pediátrico',
    notesLabel: 'Indicaciones para cuidadores',
    historyTitle: 'Controles pediátricos',
    specialtyFields: [
      { key: 'growth_percentile', label: 'Percentil crecimiento', type: 'text', placeholder: 'P50' },
      {
        key: 'vaccination_status',
        label: 'Esquema de vacunación',
        type: 'select',
        options: [
          { value: 'up_to_date', label: 'Al día' },
          { value: 'delayed', label: 'Atrasado' },
          { value: 'unknown', label: 'No documentado' },
        ],
      },
      { key: 'caregiver_notes', label: 'Notas para el tutor', type: 'textarea', fullRow: true },
    ],
  },
  gynecology: {
    intakeTitle: 'Nueva consulta ginecológica',
    chiefComplaintLabel: 'Motivo ginecológico',
    diagnosisLabel: 'Diagnóstico ginecológico',
    assessmentLabel: 'Evaluación gineco-obstétrica',
    planLabel: 'Plan gineco-obstétrico',
    historyTitle: 'Atenciones ginecológicas',
    specialtyFields: [
      { key: 'cycle_status', label: 'Estado del ciclo', type: 'text' },
      { key: 'gestational_status', label: 'Estado gestacional', type: 'select', options: YES_NO_OPTIONS },
      { key: 'screening_plan', label: 'Tamizaje/controles', type: 'textarea', fullRow: true },
    ],
  },
  traumatology: {
    intakeTitle: 'Nueva valoración traumatológica',
    chiefComplaintLabel: 'Motivo traumático',
    diagnosisLabel: 'Diagnóstico osteoarticular',
    assessmentLabel: 'Evaluación funcional',
    planLabel: 'Plan de inmovilización/rehabilitación',
    notesLabel: 'Indicaciones post trauma',
    historyTitle: 'Atenciones traumatológicas',
    specialtyFields: [
      { key: 'injury_site', label: 'Zona lesionada', type: 'text', placeholder: 'hombro derecho, rodilla...' },
      {
        key: 'injury_mechanism',
        label: 'Mecanismo de lesión',
        type: 'select',
        options: [
          { value: 'fall', label: 'Caída' },
          { value: 'sports', label: 'Deporte' },
          { value: 'work', label: 'Laboral' },
          { value: 'traffic', label: 'Accidente de tránsito' },
          { value: 'other', label: 'Otro' },
        ],
      },
      { key: 'pain_scale', label: 'Escala de dolor', type: 'select', options: PAIN_SCALE_OPTIONS },
      { key: 'mobility_status', label: 'Movilidad', type: 'select', options: SEVERITY_OPTIONS },
    ],
  },
  neurology: {
    intakeTitle: 'Nueva valoración neurológica',
    chiefComplaintLabel: 'Motivo neurológico',
    diagnosisLabel: 'Diagnóstico neurológico',
    assessmentLabel: 'Evaluación neurológica',
    planLabel: 'Plan neurológico',
    historyTitle: 'Atenciones neurológicas',
    specialtyFields: [
      { key: 'neurological_focus', label: 'Foco neurológico', type: 'text' },
      { key: 'glasgow_scale', label: 'Escala Glasgow', type: 'number' },
      { key: 'seizure_activity', label: 'Actividad convulsiva', type: 'select', options: YES_NO_OPTIONS },
      { key: 'neurology_notes', label: 'Hallazgos clínicos', type: 'textarea', fullRow: true },
    ],
  },
  'internal-medicine': {
    intakeTitle: 'Nueva consulta de medicina interna',
    chiefComplaintLabel: 'Motivo internista',
    diagnosisLabel: 'Diagnóstico internista',
    assessmentLabel: 'Evaluación multisistémica',
    planLabel: 'Plan clínico integral',
    historyTitle: 'Consultas de medicina interna',
    specialtyFields: [
      { key: 'chronic_conditions', label: 'Comorbilidades', type: 'textarea', fullRow: true },
      { key: 'medication_reconciliation', label: 'Conciliación de medicación', type: 'text' },
      { key: 'risk_level', label: 'Riesgo global', type: 'select', options: SEVERITY_OPTIONS },
    ],
  },
  dermatology: {
    intakeTitle: 'Nueva consulta dermatológica',
    chiefComplaintLabel: 'Motivo dermatológico',
    diagnosisLabel: 'Diagnóstico dermatológico',
    assessmentLabel: 'Evaluación de lesiones',
    planLabel: 'Plan dermatológico',
    historyTitle: 'Atenciones dermatológicas',
    specialtyFields: [
      { key: 'lesion_location', label: 'Localización de lesión', type: 'text' },
      { key: 'lesion_type', label: 'Tipo de lesión', type: 'text' },
      { key: 'dermoscopy_findings', label: 'Hallazgos de dermatoscopía', type: 'textarea', fullRow: true },
    ],
  },
  endocrinology: {
    intakeTitle: 'Nueva consulta endocrinológica',
    chiefComplaintLabel: 'Motivo endocrino',
    diagnosisLabel: 'Diagnóstico endocrinológico',
    assessmentLabel: 'Evaluación metabólica',
    planLabel: 'Plan endocrino',
    historyTitle: 'Atenciones endocrinológicas',
    specialtyFields: [
      {
        key: 'metabolic_focus',
        label: 'Foco metabólico',
        type: 'select',
        options: [
          { value: 'diabetes', label: 'Diabetes' },
          { value: 'thyroid', label: 'Tiroides' },
          { value: 'obesity', label: 'Obesidad' },
          { value: 'other', label: 'Otro' },
        ],
      },
      { key: 'hba1c', label: 'HbA1c (%)', type: 'text' },
      { key: 'endocrine_plan', label: 'Plan metabólico', type: 'textarea', fullRow: true },
    ],
  },
  gastroenterology: {
    intakeTitle: 'Nueva consulta gastroenterológica',
    chiefComplaintLabel: 'Motivo digestivo',
    diagnosisLabel: 'Diagnóstico digestivo',
    assessmentLabel: 'Evaluación gastroenterológica',
    planLabel: 'Plan digestivo',
    historyTitle: 'Atenciones gastroenterológicas',
    specialtyFields: [
      { key: 'symptom_pattern', label: 'Patrón de síntomas', type: 'text' },
      { key: 'stool_pattern', label: 'Patrón evacuatorio', type: 'text' },
      { key: 'endoscopy_request', label: 'Solicitudes de endoscopía/estudios', type: 'textarea', fullRow: true },
    ],
  },
  pulmonology: {
    intakeTitle: 'Nueva consulta neumológica',
    chiefComplaintLabel: 'Motivo respiratorio',
    diagnosisLabel: 'Diagnóstico respiratorio',
    assessmentLabel: 'Evaluación pulmonar',
    planLabel: 'Plan respiratorio',
    historyTitle: 'Atenciones neumológicas',
    specialtyFields: [
      {
        key: 'respiratory_pattern',
        label: 'Patrón respiratorio',
        type: 'select',
        options: [
          { value: 'stable', label: 'Estable' },
          { value: 'obstructive', label: 'Obstructivo' },
          { value: 'restrictive', label: 'Restrictivo' },
          { value: 'mixed', label: 'Mixto' },
        ],
      },
      { key: 'oxygen_saturation', label: 'Saturación O2 (%)', type: 'number' },
      { key: 'inhaler_adherence', label: 'Adherencia inhaladores', type: 'select', options: YES_NO_OPTIONS },
    ],
  },
  urology: {
    intakeTitle: 'Nueva consulta urológica',
    chiefComplaintLabel: 'Motivo urológico',
    diagnosisLabel: 'Diagnóstico urológico',
    assessmentLabel: 'Evaluación urogenital',
    planLabel: 'Plan urológico',
    historyTitle: 'Atenciones urológicas',
    specialtyFields: [
      { key: 'urinary_symptoms', label: 'Síntomas urinarios', type: 'text' },
      { key: 'psa_value', label: 'PSA', type: 'text' },
      { key: 'urology_plan', label: 'Plan urológico específico', type: 'textarea', fullRow: true },
    ],
  },
  nephrology: {
    intakeTitle: 'Nueva consulta nefrológica',
    chiefComplaintLabel: 'Motivo renal',
    diagnosisLabel: 'Diagnóstico nefrológico',
    assessmentLabel: 'Evaluación función renal',
    planLabel: 'Plan nefrológico',
    historyTitle: 'Atenciones nefrológicas',
    specialtyFields: [
      { key: 'ckd_stage', label: 'Estadio ERC', type: 'text' },
      { key: 'gfr_value', label: 'TFG', type: 'text' },
      { key: 'dialysis_status', label: 'En diálisis', type: 'select', options: YES_NO_OPTIONS },
    ],
  },
  oncology: {
    intakeTitle: 'Nueva consulta oncológica',
    chiefComplaintLabel: 'Motivo oncológico',
    diagnosisLabel: 'Diagnóstico oncológico',
    assessmentLabel: 'Evaluación de respuesta',
    planLabel: 'Plan oncológico',
    historyTitle: 'Atenciones oncológicas',
    specialtyFields: [
      { key: 'staging', label: 'Estadificación', type: 'text' },
      { key: 'treatment_line', label: 'Línea de tratamiento', type: 'text' },
      { key: 'adverse_events', label: 'Eventos adversos', type: 'textarea', fullRow: true },
    ],
  },
  otolaryngology: {
    intakeTitle: 'Nueva consulta ORL',
    chiefComplaintLabel: 'Motivo otorrinolaringológico',
    diagnosisLabel: 'Diagnóstico ORL',
    assessmentLabel: 'Evaluación ORL',
    planLabel: 'Plan ORL',
    historyTitle: 'Atenciones ORL',
    specialtyFields: [
      {
        key: 'ent_region',
        label: 'Región predominante',
        type: 'select',
        options: [
          { value: 'ear', label: 'Oído' },
          { value: 'nose', label: 'Nariz' },
          { value: 'throat', label: 'Garganta' },
        ],
      },
      { key: 'airway_risk', label: 'Riesgo de vía aérea', type: 'select', options: SEVERITY_OPTIONS },
      { key: 'orl_notes', label: 'Hallazgos ORL', type: 'textarea', fullRow: true },
    ],
  },
  ophthalmology: {
    intakeTitle: 'Nueva consulta oftalmológica',
    chiefComplaintLabel: 'Motivo visual',
    diagnosisLabel: 'Diagnóstico oftalmológico',
    assessmentLabel: 'Evaluación visual',
    planLabel: 'Plan oftalmológico',
    historyTitle: 'Atenciones oftalmológicas',
    specialtyFields: [
      { key: 'visual_acuity', label: 'Agudeza visual', type: 'text' },
      { key: 'intraocular_pressure', label: 'Presión intraocular', type: 'text' },
      { key: 'retinal_findings', label: 'Hallazgos de retina', type: 'textarea', fullRow: true },
    ],
  },
  rheumatology: {
    intakeTitle: 'Nueva consulta reumatológica',
    chiefComplaintLabel: 'Motivo reumatológico',
    diagnosisLabel: 'Diagnóstico reumatológico',
    assessmentLabel: 'Actividad inflamatoria',
    planLabel: 'Plan reumatológico',
    historyTitle: 'Atenciones reumatológicas',
    specialtyFields: [
      { key: 'inflammatory_activity', label: 'Actividad inflamatoria', type: 'select', options: SEVERITY_OPTIONS },
      { key: 'joint_count', label: 'Conteo articular doloroso', type: 'number' },
      { key: 'biologic_therapy', label: 'Terapia biológica', type: 'text' },
    ],
  },
  infectology: {
    intakeTitle: 'Nueva consulta infectológica',
    chiefComplaintLabel: 'Motivo infectológico',
    diagnosisLabel: 'Diagnóstico infectológico',
    assessmentLabel: 'Evaluación infecciosa',
    planLabel: 'Plan antimicrobiano',
    historyTitle: 'Atenciones infectológicas',
    specialtyFields: [
      { key: 'suspected_focus', label: 'Foco infeccioso', type: 'text' },
      { key: 'infection_severity', label: 'Severidad', type: 'select', options: SEVERITY_OPTIONS },
      { key: 'antimicrobial_plan', label: 'Esquema antimicrobiano', type: 'textarea', fullRow: true },
    ],
  },
  nutrition: {
    intakeTitle: 'Nueva consulta nutricional',
    chiefComplaintLabel: 'Motivo nutricional',
    diagnosisLabel: 'Diagnóstico nutricional',
    assessmentLabel: 'Evaluación antropométrica',
    planLabel: 'Plan alimentario',
    historyTitle: 'Atenciones nutrición',
    specialtyFields: [
      { key: 'bmi', label: 'IMC', type: 'text' },
      { key: 'nutritional_goal', label: 'Objetivo nutricional', type: 'text' },
      { key: 'dietary_plan', label: 'Plan dietario', type: 'textarea', fullRow: true },
    ],
  },
  physiotherapy: {
    intakeTitle: 'Nueva sesión de fisioterapia',
    chiefComplaintLabel: 'Motivo funcional',
    diagnosisLabel: 'Diagnóstico funcional',
    assessmentLabel: 'Evaluación kinésica',
    planLabel: 'Plan de rehabilitación',
    historyTitle: 'Sesiones fisioterapia',
    specialtyFields: [
      { key: 'functional_goal', label: 'Objetivo funcional', type: 'text' },
      { key: 'pain_scale', label: 'Escala de dolor', type: 'select', options: PAIN_SCALE_OPTIONS },
      { key: 'planned_sessions', label: 'Sesiones planificadas', type: 'number' },
    ],
  },
  nursing: {
    intakeTitle: 'Nuevo registro de enfermería',
    chiefComplaintLabel: 'Motivo de cuidado',
    diagnosisLabel: 'Diagnóstico de enfermería',
    assessmentLabel: 'Valoración de enfermería',
    planLabel: 'Plan de cuidados',
    historyTitle: 'Registros de enfermería',
    specialtyFields: [
      { key: 'care_plan', label: 'Plan de cuidados', type: 'textarea', fullRow: true },
      { key: 'medication_admin', label: 'Administración medicación', type: 'text' },
      { key: 'nursing_alerts', label: 'Alertas de enfermería', type: 'text' },
    ],
  },
};


export function resolveSpecialtyUiConfig(moduleKey: string | null | undefined): SpecialtyUiConfig {
  const key = (moduleKey || '').trim();
  const override = key ? SPECIALTY_UI_CONFIG[key] : null;
  const brief = key ? SPECIALTY_BRIEFS[key] : null;

  return {
    ...DEFAULT_UI_CONFIG,
    ...(override || {}),
    ...(brief || {}),
    specialtyFields: override?.specialtyFields || DEFAULT_UI_CONFIG.specialtyFields,
  };
}
