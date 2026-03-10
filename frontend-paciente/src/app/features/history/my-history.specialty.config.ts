import { PatientOdontogram, PatientOdontogramTooth } from '../../core/models/patient.model';
import { PatientSpecialtyHistory } from '../../core/models/specialty.model';
import * as SECTION_CONFIG_JSON from './specialty-board-config.json';

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

const SECTION_CONFIG: Record<string, SpecialtySectionConfig[]> = SECTION_CONFIG_JSON as Record<string, SpecialtySectionConfig[]>;


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
