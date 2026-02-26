import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  CreateSpecialtyEncounterPayload,
  SpecialtyEncounter,
  SpecialtyModuleContext,
  SpecialtyModuleOverview,
  SpecialtyModuleService
} from '../core/services/specialty-module.service';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

type SpecialtyFieldType = 'text' | 'number' | 'date' | 'select' | 'textarea';
type SpecialtyFieldTarget = 'vitals' | 'payload';

type SpecialtyFieldDefinition = {
  key: string;
  label: string;
  type: SpecialtyFieldType;
  target: SpecialtyFieldTarget;
  placeholder?: string;
  min?: number;
  step?: string;
  options?: Array<{ value: string; label: string }>;
};

const LEGACY_SPECIALTY_MODULES = new Set(['odontology', 'psychology', 'psychopedagogy']);

const DEFAULT_SPECIALTY_FIELDS: SpecialtyFieldDefinition[] = [
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

const SPECIALTY_FIELD_TEMPLATES: Record<string, SpecialtyFieldDefinition[]> = {
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

@Component({
  selector: 'app-specialty-module-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>{{ context?.module?.label || 'Modulo de especialidad' }}</h1>
      <p>{{ context?.module?.description || 'Gestion clinica especializada por profesional y pacientes asignados.' }}</p>

      <div class="toolbar">
        <button type="button" class="refresh-button" (click)="loadData()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      @if (context) {
        <article class="card">
          <h2 class="card-title">Bloques funcionales</h2>
          <div class="chip-grid">
            @for (section of context.module.coreSections; track section) {
              <span class="chip">{{ section }}</span>
            }
          </div>
          <div class="quick-actions">
            <a routerLink="/patients" class="quick-link">Pacientes</a>
            <a routerLink="/appointments" class="quick-link">Citas</a>
            <a routerLink="/medical-records" class="quick-link">Registros</a>
            <a routerLink="/budgets" class="quick-link">Presupuestos</a>
            <a routerLink="/files" class="quick-link">Archivos</a>
            <a routerLink="/payments" class="quick-link">Pagos</a>
            @if (context.module.key === 'odontology') {
              <a routerLink="/odontology" class="quick-link primary">Ir a Odontologia</a>
            }
            @if (context.module.key === 'psychology' || context.module.key === 'psychopedagogy') {
              <a routerLink="/mental-health" class="quick-link primary">Ir a Salud Mental</a>
            }
          </div>
        </article>
      }

      @if (overview) {
        <div class="grid">
          <article class="card">
            <h2 class="card-title">Pacientes</h2>
            <p class="metric">{{ overview.totals.patients }}</p>
            <p class="card-text">Activos: {{ overview.totals.patients_active }}</p>
          </article>
          <article class="card">
            <h2 class="card-title">Citas</h2>
            <p class="metric">{{ overview.totals.appointments_total }}</p>
            <p class="card-text">Proximas: {{ overview.totals.appointments_upcoming }}</p>
          </article>
          <article class="card">
            <h2 class="card-title">Registros clinicos</h2>
            <p class="metric">{{ overview.totals.medical_records }}</p>
            <p class="card-text">Historial de evolucion del modulo.</p>
          </article>
          <article class="card">
            <h2 class="card-title">Facturacion</h2>
            <p class="metric">
              {{ overview.totals.revenue_completed | currency:(overview.totals.currency || 'ARS'):'symbol':'1.0-2' }}
            </p>
            <p class="card-text">Pagos completados: {{ overview.totals.payments_completed }}</p>
          </article>
        </div>

        <div class="grid lower-grid">
          <article class="card">
            <h2 class="card-title">Pacientes asignados</h2>
            @if (overview.patients.length === 0) {
              <p class="card-text">No hay pacientes asignados a tu modulo.</p>
            } @else {
              <ul class="simple-list">
                @for (patient of overview.patients; track patient.id) {
                  <li>
                    <span>#{{ patient.id }} - {{ patient.first_name }} {{ patient.last_name }}</span>
                    <small>{{ patient.email }}</small>
                  </li>
                }
              </ul>
            }
          </article>

          <article class="card">
            <h2 class="card-title">Proximas citas</h2>
            @if (overview.upcoming_appointments.length === 0) {
              <p class="card-text">Sin citas proximas para esta especialidad.</p>
            } @else {
              <ul class="simple-list">
                @for (appointment of overview.upcoming_appointments; track appointment.id) {
                  <li>
                    <span>#{{ appointment.id }} - {{ appointment.patient_name }}</span>
                    <strong>{{ appointment.appointment_date | date:'short' }}</strong>
                  </li>
                }
              </ul>
            }
          </article>
        </div>

        @if (isClinicalModuleEnabled) {
          <article class="card lower-grid">
            <h2 class="card-title">
              @if (editingEncounterId) {
                Editar consulta #{{ editingEncounterId }} · {{ context?.module?.label }}
              } @else {
                Nueva consulta de {{ context?.module?.label }}
              }
            </h2>

            <form [formGroup]="encounterForm" (ngSubmit)="submitEncounter()" class="form-grid" novalidate>
              <label>
                Paciente
                <select formControlName="patient_id">
                  <option [ngValue]="0">Selecciona paciente</option>
                  @for (patient of overview.patients; track patient.id) {
                    <option [ngValue]="patient.id">
                      {{ patient.first_name }} {{ patient.last_name }} (#{{ patient.id }})
                    </option>
                  }
                </select>
              </label>

              <label>
                Fecha de consulta
                <input type="date" formControlName="visit_date" />
              </label>

              <label>
                Estado
                <select formControlName="status">
                  <option value="open">Abierto</option>
                  <option value="in_progress">En progreso</option>
                  <option value="closed">Cerrado</option>
                </select>
              </label>

              <label class="full-row">
                Motivo de consulta
                <textarea rows="2" formControlName="chief_complaint"></textarea>
              </label>

              <label>
                Diagnostico
                <input type="text" formControlName="diagnosis" />
              </label>

              <label>
                Evaluacion clinica
                <input type="text" formControlName="assessment" />
              </label>

              <label class="full-row">
                Plan terapeutico
                <textarea rows="2" formControlName="plan"></textarea>
              </label>

              <label class="full-row">
                Notas
                <textarea rows="2" formControlName="notes"></textarea>
              </label>

              <h3 class="subsection-title full-row">Campos de {{ context?.module?.label }}</h3>
              @for (field of moduleFields; track field.key) {
                <label [class.full-row]="field.type === 'textarea'">
                  {{ field.label }}
                  @switch (field.type) {
                    @case ('select') {
                      <select [formControlName]="field.key">
                        <option value="">Sin definir</option>
                        @for (option of field.options || []; track option.value) {
                          <option [value]="option.value">{{ option.label }}</option>
                        }
                      </select>
                    }
                    @case ('textarea') {
                      <textarea
                        rows="2"
                        [attr.placeholder]="field.placeholder || null"
                        [formControlName]="field.key"
                      ></textarea>
                    }
                    @default {
                      <input
                        [type]="field.type"
                        [attr.min]="field.min ?? null"
                        [attr.step]="field.step ?? null"
                        [attr.placeholder]="field.placeholder || null"
                        [formControlName]="field.key"
                      />
                    }
                  }
                </label>
              }

              @if (fieldError) {
                <p class="field-error full-row">{{ fieldError }}</p>
              }

              <div class="form-actions full-row">
                <button class="primary-button" type="submit" [disabled]="encounterSubmitting">
                  @if (encounterSubmitting) {
                    Guardando...
                  } @else if (editingEncounterId) {
                    Guardar cambios
                  } @else {
                    Registrar consulta
                  }
                </button>
                @if (editingEncounterId) {
                  <button class="secondary-button" type="button" (click)="cancelEditEncounter()">
                    Cancelar edicion
                  </button>
                }
              </div>
            </form>
          </article>

          <article class="card lower-grid">
            <h2 class="card-title">Consultas registradas</h2>
            <form class="filter-grid" [formGroup]="encounterFilterForm" novalidate>
              <label>
                Paciente
                <select formControlName="patient_id">
                  <option [ngValue]="0">Todos</option>
                  @for (patient of overview.patients; track patient.id) {
                    <option [ngValue]="patient.id">
                      {{ patient.first_name }} {{ patient.last_name }} (#{{ patient.id }})
                    </option>
                  }
                </select>
              </label>
              <label>
                Estado
                <select formControlName="status">
                  <option value="">Todos</option>
                  <option value="open">Abierto</option>
                  <option value="in_progress">En progreso</option>
                  <option value="closed">Cerrado</option>
                </select>
              </label>
              <label>
                Desde
                <input type="date" formControlName="date_from" />
              </label>
              <label>
                Hasta
                <input type="date" formControlName="date_to" />
              </label>
              <label class="full-row">
                Buscar por motivo, diagnostico o notas
                <input type="text" formControlName="search" placeholder="Ej: control, dolor, riesgo..." />
              </label>
              <div class="form-actions full-row">
                <button class="secondary-button" type="button" (click)="resetEncounterFilters()">
                  Limpiar filtros
                </button>
              </div>
            </form>

            @if (filteredEncounters.length === 0) {
              <p class="card-text">Sin consultas registradas para esta especialidad.</p>
            } @else {
              <ul class="simple-list">
                @for (encounter of filteredEncounters; track encounter.id) {
                  <li>
                    <div>
                      <strong>#{{ encounter.id }} · {{ encounter.patient_name || ('Paciente #' + encounter.patient_id) }}</strong>
                      <p class="list-secondary">{{ encounter.chief_complaint }}</p>
                      @if (getEncounterHighlightsText(encounter)) {
                        <small class="list-secondary">{{ getEncounterHighlightsText(encounter) }}</small>
                      }
                      <small>{{ encounter.visit_date | date:'short' }} · {{ encounter.status }}</small>
                    </div>
                    <div class="row-actions">
                      <button class="secondary-action" type="button" (click)="startEditEncounter(encounter)">
                        Editar
                      </button>
                      <button class="danger-action" type="button" (click)="deleteEncounter(encounter.id)">
                        Eliminar
                      </button>
                    </div>
                  </li>
                }
              </ul>
            }
          </article>
        } @else {
          <article class="card lower-grid">
            <h2 class="card-title">Implementacion de dominio</h2>
            <p class="card-text">
              Este modulo usa un flujo dedicado. Accede desde el acceso rapido superior para operar su historia clinica.
            </p>
          </article>
        }

        <article class="card lower-grid">
          <h2 class="card-title">Registros recientes</h2>
          @if (overview.recent_medical_records.length === 0) {
            <p class="card-text">Sin registros recientes en este modulo.</p>
          } @else {
            <ul class="simple-list">
              @for (record of overview.recent_medical_records; track record.id) {
                <li>
                  <span>#{{ record.id }} - {{ record.patient_name }}</span>
                  <small>{{ record.record_date | date:'shortDate' }}</small>
                </li>
              }
            </ul>
          }
        </article>
      }
    </section>
  `,
  styles: [
    pageShellStyles,
    `
      .toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 0.75rem;
      }

      .refresh-button {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.7rem;
      }

      .refresh-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 0.4rem 0 0.5rem;
      }

      .chip {
        background: var(--ms-primary-soft-bg);
        border: 1px solid var(--ms-primary-soft-border);
        border-radius: 999px;
        color: var(--ms-primary);
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.2rem 0.55rem;
      }

      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .quick-link {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        font-size: 0.78rem;
        font-weight: 600;
        padding: 0.3rem 0.55rem;
        text-decoration: none;
      }

      .quick-link.primary {
        background: var(--ms-primary);
        border-color: var(--ms-primary);
        color: var(--ms-bg-card);
      }

      .metric {
        color: var(--ms-text-strong);
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
      }

      .lower-grid {
        margin-top: 0.75rem;
      }

      .simple-list {
        list-style: none;
        margin: 0.35rem 0 0;
        padding: 0;
      }

      .simple-list li {
        align-items: center;
        border-bottom: 1px solid var(--ms-border);
        display: flex;
        font-size: 0.8rem;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.4rem 0;
      }

      .simple-list small,
      .list-secondary {
        color: var(--ms-text-secondary);
      }

      .list-secondary {
        margin: 0.2rem 0;
      }

      .form-grid {
        display: grid;
        gap: 0.6rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-top: 0.5rem;
      }

      .filter-grid {
        border: 1px solid var(--ms-border);
        border-radius: 10px;
        display: grid;
        gap: 0.55rem;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin: 0.5rem 0;
        padding: 0.55rem;
      }

      .form-grid label {
        color: var(--ms-text-primary);
        display: grid;
        font-size: 0.78rem;
        font-weight: 600;
        gap: 0.3rem;
      }

      .filter-grid label {
        color: var(--ms-text-primary);
        display: grid;
        font-size: 0.76rem;
        font-weight: 600;
        gap: 0.3rem;
      }

      .subsection-title {
        color: var(--ms-text-primary);
        font-size: 0.86rem;
        margin: 0.2rem 0 0;
      }

      .full-row {
        grid-column: 1 / -1;
      }

      .form-grid input,
      .form-grid textarea,
      .form-grid select,
      .filter-grid input,
      .filter-grid textarea,
      .filter-grid select {
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        font-size: 0.82rem;
        padding: 0.45rem 0.6rem;
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
      }

      .primary-button {
        background: var(--ms-primary);
        border: 0;
        border-radius: 8px;
        color: var(--ms-bg-card);
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.45rem 0.75rem;
      }

      .primary-button:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .secondary-button {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.45rem 0.75rem;
      }

      .secondary-button:hover,
      .secondary-button:focus-visible {
        border-color: var(--ms-primary);
        color: var(--ms-primary);
      }

      .row-actions {
        display: inline-flex;
        gap: 0.35rem;
      }

      .secondary-action {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.3rem 0.55rem;
      }

      .danger-action {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-danger-soft-border);
        border-radius: 8px;
        color: var(--ms-danger);
        cursor: pointer;
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.3rem 0.55rem;
      }

      .error-box,
      .success-box {
        border-radius: 8px;
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.7rem;
      }

      .error-box {
        background: var(--ms-danger-soft-bg);
        border: 1px solid var(--ms-danger-soft-border);
        color: var(--ms-danger);
      }

      .success-box {
        background: var(--ms-success-soft-bg);
        border: 1px solid var(--ms-success-soft-border);
        color: var(--ms-success);
      }

      .field-error {
        color: var(--ms-danger);
        font-size: 0.78rem;
        margin: 0;
      }
    `
  ]
})
export class SpecialtyModulePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(UntypedFormBuilder);
  private readonly specialtyModuleService = inject(SpecialtyModuleService);

  loading = false;
  encounterSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  editingEncounterId: number | null = null;

  context: SpecialtyModuleContext | null = null;
  overview: SpecialtyModuleOverview | null = null;
  encounters: SpecialtyEncounter[] = [];
  moduleFields: SpecialtyFieldDefinition[] = [];

  private dynamicFieldKeys: string[] = [];

  readonly encounterForm = this.fb.group({
    patient_id: [0, [Validators.required, Validators.min(1)]],
    visit_date: [this.formatDateForInput(new Date()), [Validators.required]],
    status: ['open', [Validators.required]],
    chief_complaint: ['', [Validators.required]],
    diagnosis: [''],
    assessment: [''],
    plan: [''],
    notes: ['']
  });
  readonly encounterFilterForm = this.fb.group({
    patient_id: [0],
    status: [''],
    date_from: [''],
    date_to: [''],
    search: ['']
  });

  get isClinicalModuleEnabled(): boolean {
    const key = this.context?.module?.key;
    return Boolean(key) && !LEGACY_SPECIALTY_MODULES.has(String(key));
  }

  get filteredEncounters(): SpecialtyEncounter[] {
    const filters = this.encounterFilterForm.getRawValue();
    const patientId = Number(filters.patient_id || 0);
    const status = String(filters.status || '').trim();
    const dateFrom = String(filters.date_from || '').trim();
    const dateTo = String(filters.date_to || '').trim();
    const searchTerm = String(filters.search || '').trim().toLowerCase();

    return this.encounters.filter((encounter) => {
      if (patientId > 0 && encounter.patient_id !== patientId) {
        return false;
      }

      if (status && encounter.status !== status) {
        return false;
      }

      const encounterDate = this.toInputDate(encounter.visit_date);
      if (dateFrom && encounterDate < dateFrom) {
        return false;
      }
      if (dateTo && encounterDate > dateTo) {
        return false;
      }

      if (searchTerm) {
        const searchable = [
          encounter.patient_name || '',
          encounter.chief_complaint || '',
          encounter.diagnosis || '',
          encounter.assessment || '',
          encounter.plan || '',
          encounter.notes || ''
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = null;

    this.specialtyModuleService
      .getMyModule()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (context) => {
          this.context = context;
          this.ensureRouteMatchesModule(context);
          this.syncDynamicFieldControls();
          this.cancelEditEncounter(true);
          this.loadOverview();
          this.loadEncounters();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  submitEncounter(): void {
    if (this.editingEncounterId) {
      this.updateEncounter();
      return;
    }
    this.createEncounter();
  }

  createEncounter(): void {
    if (this.encounterForm.invalid) {
      this.encounterForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos de la consulta.';
      return;
    }

    this.encounterSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.fieldError = null;

    const payload = this.buildEncounterPayload();
    if (!payload) {
      this.errorMessage = 'No se pudo resolver el modulo actual.';
      this.encounterSubmitting = false;
      return;
    }

    this.specialtyModuleService
      .createEncounter(payload)
      .pipe(finalize(() => (this.encounterSubmitting = false)))
      .subscribe({
        next: (encounter) => {
          this.encounters = [encounter, ...this.encounters];
          this.successMessage = `Consulta #${encounter.id} registrada.`;
          this.resetEncounterForm();
          this.loadOverview();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  updateEncounter(): void {
    if (!this.editingEncounterId) {
      return;
    }
    if (this.encounterForm.invalid) {
      this.encounterForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos de la consulta.';
      return;
    }

    this.encounterSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.fieldError = null;

    const payload = this.buildEncounterPayload();
    if (!payload) {
      this.errorMessage = 'No se pudo resolver el modulo actual.';
      this.encounterSubmitting = false;
      return;
    }

    this.specialtyModuleService
      .updateEncounter(this.editingEncounterId, payload)
      .pipe(finalize(() => (this.encounterSubmitting = false)))
      .subscribe({
        next: (encounter) => {
          this.encounters = this.encounters.map((item) =>
            item.id === encounter.id ? encounter : item
          );
          this.successMessage = `Consulta #${encounter.id} actualizada.`;
          this.cancelEditEncounter();
          this.loadOverview();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  startEditEncounter(encounter: SpecialtyEncounter): void {
    this.editingEncounterId = encounter.id;
    this.fieldError = null;
    this.errorMessage = null;
    this.successMessage = null;

    this.encounterForm.patchValue({
      patient_id: encounter.patient_id,
      visit_date: this.toInputDate(encounter.visit_date),
      status: encounter.status,
      chief_complaint: encounter.chief_complaint || '',
      diagnosis: encounter.diagnosis || '',
      assessment: encounter.assessment || '',
      plan: encounter.plan || '',
      notes: encounter.notes || ''
    });

    for (const field of this.moduleFields) {
      this.encounterForm
        .get(field.key)
        ?.setValue(this.getEncounterFieldValue(encounter, field.key));
    }
  }

  cancelEditEncounter(silent = false): void {
    this.editingEncounterId = null;
    this.resetEncounterForm();
    if (!silent) {
      this.successMessage = null;
      this.fieldError = null;
    }
  }

  deleteEncounter(encounterId: number): void {
    const confirmed = globalThis.confirm(`Eliminar consulta #${encounterId}?`);
    if (!confirmed) {
      return;
    }

    this.specialtyModuleService.deleteEncounter(encounterId).subscribe({
      next: () => {
        this.encounters = this.encounters.filter((item) => item.id !== encounterId);
        this.successMessage = `Consulta #${encounterId} eliminada.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
      });
  }

  getEncounterHighlights(encounter: SpecialtyEncounter): string[] {
    const summary: string[] = [];
    const payloadEntries = { ...(encounter.vitals || {}), ...(encounter.payload || {}) };
    for (const field of this.moduleFields) {
      const rawValue = payloadEntries[field.key];
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        continue;
      }

      const value = typeof rawValue === 'string' ? rawValue : String(rawValue);
      if (value.trim().length === 0) {
        continue;
      }
      summary.push(`${field.label}: ${value}`);
      if (summary.length >= 2) {
        break;
      }
    }
    return summary;
  }

  getEncounterHighlightsText(encounter: SpecialtyEncounter): string {
    return this.getEncounterHighlights(encounter).join(' · ');
  }

  resetEncounterFilters(): void {
    this.encounterFilterForm.reset({
      patient_id: 0,
      status: '',
      date_from: '',
      date_to: '',
      search: ''
    });
  }

  private syncDynamicFieldControls(): void {
    for (const key of this.dynamicFieldKeys) {
      if (this.encounterForm.contains(key)) {
        this.encounterForm.removeControl(key);
      }
    }

    this.dynamicFieldKeys = [];
    this.moduleFields = [];

    if (!this.isClinicalModuleEnabled) {
      return;
    }

    const moduleKey = this.context?.module?.key || 'general-medicine';
    this.moduleFields = SPECIALTY_FIELD_TEMPLATES[moduleKey] || DEFAULT_SPECIALTY_FIELDS;

    for (const field of this.moduleFields) {
      this.encounterForm.addControl(field.key, new UntypedFormControl(''));
      this.dynamicFieldKeys.push(field.key);
    }
  }

  private buildDynamicPayload(): {
    vitals: Record<string, string | number>;
    payload: Record<string, string | number>;
  } {
    const vitals: Record<string, string | number> = {};
    const payload: Record<string, string | number> = {};

    for (const field of this.moduleFields) {
      const rawValue = this.encounterForm.get(field.key)?.value;
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        continue;
      }

      let value: string | number;
      if (field.type === 'number') {
        const parsed = Number(rawValue);
        if (Number.isNaN(parsed)) {
          continue;
        }
        value = parsed;
      } else {
        value = String(rawValue).trim();
        if (!value) {
          continue;
        }
      }

      if (field.target === 'vitals') {
        vitals[field.key] = value;
      } else {
        payload[field.key] = value;
      }
    }

    return { vitals, payload };
  }

  private buildEncounterPayload(): CreateSpecialtyEncounterPayload | null {
    if (!this.context) {
      return null;
    }

    const baseValues = this.encounterForm.getRawValue();
    const dynamicPayload = this.buildDynamicPayload();

    return {
      patient_id: Number(baseValues.patient_id),
      specialty_key: this.context.module.key,
      visit_date: `${baseValues.visit_date}T00:00:00`,
      status: (baseValues.status as 'open' | 'in_progress' | 'closed') || 'open',
      chief_complaint: String(baseValues.chief_complaint || '').trim(),
      diagnosis: String(baseValues.diagnosis || '').trim() || undefined,
      assessment: String(baseValues.assessment || '').trim() || undefined,
      plan: String(baseValues.plan || '').trim() || undefined,
      notes: String(baseValues.notes || '').trim() || undefined,
      vitals: Object.keys(dynamicPayload.vitals).length > 0 ? dynamicPayload.vitals : undefined,
      payload: Object.keys(dynamicPayload.payload).length > 0 ? dynamicPayload.payload : undefined
    };
  }

  private resetEncounterForm(): void {
    this.encounterForm.reset({
      patient_id: 0,
      visit_date: this.formatDateForInput(new Date()),
      status: 'open',
      chief_complaint: '',
      diagnosis: '',
      assessment: '',
      plan: '',
      notes: ''
    });

    for (const key of this.dynamicFieldKeys) {
      this.encounterForm.get(key)?.setValue('');
    }
  }

  private getEncounterFieldValue(encounter: SpecialtyEncounter, key: string): string | number {
    const rawValue = encounter.vitals?.[key] ?? encounter.payload?.[key];
    if (rawValue === null || rawValue === undefined) {
      return '';
    }
    return typeof rawValue === 'number' ? rawValue : String(rawValue);
  }

  private loadOverview(): void {
    this.specialtyModuleService.getMyModuleOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private loadEncounters(): void {
    if (!this.context || !this.isClinicalModuleEnabled) {
      this.encounters = [];
      return;
    }

    this.specialtyModuleService
      .listEncounters({ specialty_key: this.context.module.key })
      .subscribe({
        next: (encounters) => {
          this.encounters = encounters;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private ensureRouteMatchesModule(context: SpecialtyModuleContext): void {
    const routeSpecialtyKey = this.route.snapshot.paramMap.get('specialtyKey');
    if (!routeSpecialtyKey) {
      return;
    }

    if (routeSpecialtyKey !== context.module.key) {
      void this.router.navigateByUrl(context.module.route);
    }
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toInputDate(value: string | null | undefined): string {
    if (!value) {
      return this.formatDateForInput(new Date());
    }
    const normalized = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return this.formatDateForInput(new Date());
    }
    return this.formatDateForInput(parsed);
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudo completar la operacion en el modulo de especialidad.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
