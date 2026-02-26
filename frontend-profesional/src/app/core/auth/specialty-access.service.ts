import { Injectable } from '@angular/core';

export type MentalHealthModule = 'psychology' | 'psychopedagogy';
export type SpecialtyModuleKey =
  | 'odontology'
  | 'psychology'
  | 'psychopedagogy'
  | 'cardiology'
  | 'pediatrics'
  | 'gynecology'
  | 'traumatology'
  | 'neurology'
  | 'internal-medicine'
  | 'dermatology'
  | 'endocrinology'
  | 'gastroenterology'
  | 'pulmonology'
  | 'urology'
  | 'nephrology'
  | 'oncology'
  | 'otolaryngology'
  | 'ophthalmology'
  | 'rheumatology'
  | 'infectology'
  | 'nutrition'
  | 'physiotherapy'
  | 'nursing'
  | 'general-medicine';

export interface SpecialtyModuleDefinition {
  key: SpecialtyModuleKey;
  label: string;
  description: string;
  aliases: string[];
  route: string;
  coreSections: string[];
}

export const ODONTOLOGY_SPECIALTIES = [
  'odontologia',
  'odontology',
  'ortodoncia',
  'odontopediatria',
  'odontologo',
  'odontologa'
];

export const PSYCHOLOGY_SPECIALTIES = [
  'psicologia',
  'psychology',
  'psicologo',
  'psicologa',
  'psiquiatria'
];

export const PSYCHOPEDAGOGY_SPECIALTIES = [
  'psicopedagogia',
  'psychopedagogy',
  'psicopedagogo',
  'psicopedagoga'
];

export const SPECIALTY_MODULES: SpecialtyModuleDefinition[] = [
  {
    key: 'odontology',
    label: 'Odontología',
    description: 'Historia clínica odontológica, odontograma, periodontograma y tratamientos.',
    aliases: [...ODONTOLOGY_SPECIALTIES],
    route: '/odontology',
    coreSections: ['Agenda clínica', 'Odontogramas', 'Tratamientos', 'Documentos', 'Recetas']
  },
  {
    key: 'psychology',
    label: 'Psicología',
    description: 'Evaluaciones psicológicas, sesiones terapéuticas y seguimiento de evolución.',
    aliases: [...PSYCHOLOGY_SPECIALTIES],
    route: '/mental-health',
    coreSections: ['Evaluaciones', 'Sesiones', 'Plan terapéutico', 'Indicadores', 'Derivaciones']
  },
  {
    key: 'psychopedagogy',
    label: 'Psicopedagogía',
    description: 'Evaluaciones psicopedagógicas e intervenciones por paciente.',
    aliases: [...PSYCHOPEDAGOGY_SPECIALTIES],
    route: '/mental-health',
    coreSections: ['Evaluaciones', 'Intervenciones', 'Objetivos', 'Progreso', 'Informes']
  },
  {
    key: 'cardiology',
    label: 'Cardiología',
    description: 'Seguimiento cardiovascular, controles clínicos y riesgo cardiometabólico.',
    aliases: ['cardiologia', 'cardiology', 'cardiologo', 'cardiologa'],
    route: '/specialties/cardiology',
    coreSections: ['Consultas', 'Riesgo cardiovascular', 'Estudios', 'Tratamiento', 'Evolución']
  },
  {
    key: 'pediatrics',
    label: 'Pediatría',
    description: 'Atención pediátrica integral con controles de crecimiento y desarrollo.',
    aliases: ['pediatria', 'pediatrics', 'pediatra'],
    route: '/specialties/pediatrics',
    coreSections: ['Controles', 'Vacunación', 'Crecimiento', 'Interconsultas', 'Educación familiar']
  },
  {
    key: 'gynecology',
    label: 'Ginecología',
    description: 'Consulta ginecológica, salud reproductiva y controles periódicos.',
    aliases: ['ginecologia', 'ginecology', 'obstetricia', 'gineco-obstetricia'],
    route: '/specialties/gynecology',
    coreSections: ['Consultas', 'Controles', 'Estudios', 'Tratamientos', 'Seguimiento']
  },
  {
    key: 'traumatology',
    label: 'Traumatología',
    description: 'Atención osteoarticular, lesiones y rehabilitación funcional.',
    aliases: ['traumatologia', 'traumatology', 'ortopedia', 'ortopedista'],
    route: '/specialties/traumatology',
    coreSections: ['Lesiones', 'Diagnóstico', 'Tratamiento', 'Rehabilitación', 'Control']
  },
  {
    key: 'neurology',
    label: 'Neurología',
    description: 'Evaluación neurológica y control de patologías del sistema nervioso.',
    aliases: ['neurologia', 'neurology', 'neurologo', 'neurologa'],
    route: '/specialties/neurology',
    coreSections: ['Consulta', 'Síndromes', 'Estudios', 'Tratamiento', 'Seguimiento']
  },
  {
    key: 'internal-medicine',
    label: 'Medicina Interna',
    description: 'Gestión clínica integral de pacientes adultos y patologías crónicas.',
    aliases: ['medicina interna', 'internal medicine', 'clinica medica'],
    route: '/specialties/internal-medicine',
    coreSections: ['Consulta', 'Crónicos', 'Interconsultas', 'Tratamiento', 'Evolución']
  },
  {
    key: 'dermatology',
    label: 'Dermatología',
    description: 'Diagnóstico y seguimiento de patologías cutáneas.',
    aliases: ['dermatologia', 'dermatology', 'dermatologo', 'dermatologa'],
    route: '/specialties/dermatology',
    coreSections: ['Consulta', 'Lesiones', 'Tratamientos', 'Control', 'Documentación']
  },
  {
    key: 'endocrinology',
    label: 'Endocrinología',
    description: 'Control metabólico y endocrino de larga evolución.',
    aliases: ['endocrinologia', 'endocrinology', 'endocrino'],
    route: '/specialties/endocrinology',
    coreSections: ['Consulta', 'Metabólico', 'Laboratorio', 'Ajustes', 'Seguimiento']
  },
  {
    key: 'gastroenterology',
    label: 'Gastroenterología',
    description: 'Atención digestiva y seguimiento de patologías gastrohepáticas.',
    aliases: ['gastroenterologia', 'gastroenterology', 'gastro'],
    route: '/specialties/gastroenterology',
    coreSections: ['Consulta', 'Síntomas', 'Estudios', 'Tratamiento', 'Seguimiento']
  },
  {
    key: 'pulmonology',
    label: 'Neumología',
    description: 'Manejo respiratorio y patologías pulmonares crónicas/agudas.',
    aliases: ['neumologia', 'pulmonology', 'neumologo', 'neumologa'],
    route: '/specialties/pulmonology',
    coreSections: ['Consulta', 'Función pulmonar', 'Crisis', 'Tratamiento', 'Control']
  },
  {
    key: 'urology',
    label: 'Urología',
    description: 'Atención del tracto urinario y salud urogenital.',
    aliases: ['urologia', 'urology', 'urologo', 'urologa'],
    route: '/specialties/urology',
    coreSections: ['Consulta', 'Diagnóstico', 'Tratamiento', 'Intervención', 'Seguimiento']
  },
  {
    key: 'nephrology',
    label: 'Nefrología',
    description: 'Seguimiento renal y trastornos hidroelectrolíticos.',
    aliases: ['nefrologia', 'nephrology', 'nefrologo', 'nefrologa'],
    route: '/specialties/nephrology',
    coreSections: ['Consulta', 'Función renal', 'Riesgo', 'Tratamiento', 'Control']
  },
  {
    key: 'oncology',
    label: 'Oncología',
    description: 'Atención oncológica, tratamiento y continuidad clínica.',
    aliases: ['oncologia', 'oncology', 'oncologo', 'oncologa'],
    route: '/specialties/oncology',
    coreSections: ['Consulta', 'Estadificación', 'Tratamiento', 'Respuesta', 'Seguimiento']
  },
  {
    key: 'otolaryngology',
    label: 'Otorrinolaringología',
    description: 'Manejo de patología otorrino y vías aéreas superiores.',
    aliases: ['otorrino', 'otorrinolaringologia', 'otolaryngology'],
    route: '/specialties/otolaryngology',
    coreSections: ['Consulta', 'Diagnóstico', 'Tratamiento', 'Procedimientos', 'Control']
  },
  {
    key: 'ophthalmology',
    label: 'Oftalmología',
    description: 'Evaluación visual y seguimiento oftalmológico.',
    aliases: ['oftalmologia', 'ophthalmology', 'oculista'],
    route: '/specialties/ophthalmology',
    coreSections: ['Consulta', 'Agudeza visual', 'Diagnóstico', 'Tratamiento', 'Control']
  },
  {
    key: 'rheumatology',
    label: 'Reumatología',
    description: 'Atención músculo-esquelética inflamatoria y autoinmune.',
    aliases: ['reumatologia', 'rheumatology', 'reumatologo', 'reumatologa'],
    route: '/specialties/rheumatology',
    coreSections: ['Consulta', 'Actividad inflamatoria', 'Tratamiento', 'Escalas', 'Seguimiento']
  },
  {
    key: 'infectology',
    label: 'Infectología',
    description: 'Diagnóstico y manejo de enfermedades infecciosas.',
    aliases: ['infectologia', 'infectology', 'infectologo', 'infectologa'],
    route: '/specialties/infectology',
    coreSections: ['Consulta', 'Agente etiológico', 'Tratamiento', 'Aislamiento', 'Control']
  },
  {
    key: 'nutrition',
    label: 'Nutrición',
    description: 'Evaluación nutricional, plan alimentario y evolución.',
    aliases: ['nutricion', 'nutrition', 'nutricionista'],
    route: '/specialties/nutrition',
    coreSections: ['Evaluación', 'Plan nutricional', 'Objetivos', 'Controles', 'Evolución']
  },
  {
    key: 'physiotherapy',
    label: 'Fisioterapia',
    description: 'Rehabilitación física y funcional por objetivos.',
    aliases: ['fisioterapia', 'physiotherapy', 'kinesiologia', 'kinesiologo', 'kinesiologa'],
    route: '/specialties/physiotherapy',
    coreSections: ['Evaluación', 'Sesiones', 'Plan terapéutico', 'Indicadores', 'Alta']
  },
  {
    key: 'nursing',
    label: 'Enfermería',
    description: 'Cuidados de enfermería y seguimiento clínico continuo.',
    aliases: ['enfermeria', 'nursing', 'enfermero', 'enfermera'],
    route: '/specialties/nursing',
    coreSections: ['Admisión', 'Ejecución', 'Medicaciones', 'Observaciones', 'Turnos']
  },
  {
    key: 'general-medicine',
    label: 'Medicina General',
    description: 'Atención clínica de primer nivel y coordinación asistencial.',
    aliases: ['medicina general', 'general medicine', 'medico general', 'generalista'],
    route: '/specialties/general-medicine',
    coreSections: ['Consulta', 'Diagnóstico', 'Tratamiento', 'Derivaciones', 'Seguimiento']
  }
];

@Injectable({
  providedIn: 'root'
})
export class SpecialtyAccessService {
  normalize(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  hasSpecialtyAccess(
    specialty: string | null | undefined,
    allowedSpecialties: string[] | undefined
  ): boolean {
    if (!allowedSpecialties || allowedSpecialties.length === 0) {
      return true;
    }

    const normalizedSpecialty = this.normalize(specialty);
    if (!normalizedSpecialty) {
      return false;
    }

    return allowedSpecialties.some((candidate) =>
      normalizedSpecialty.includes(this.normalize(candidate))
    );
  }

  getMentalHealthModules(specialty: string | null | undefined): MentalHealthModule[] {
    const modules: MentalHealthModule[] = [];

    if (this.hasSpecialtyAccess(specialty, PSYCHOLOGY_SPECIALTIES)) {
      modules.push('psychology');
    }
    if (this.hasSpecialtyAccess(specialty, PSYCHOPEDAGOGY_SPECIALTIES)) {
      modules.push('psychopedagogy');
    }

    return modules;
  }

  getDefaultMentalHealthModule(specialty: string | null | undefined): MentalHealthModule {
    const modules = this.getMentalHealthModules(specialty);
    if (modules.includes('psychopedagogy') && !modules.includes('psychology')) {
      return 'psychopedagogy';
    }
    return 'psychology';
  }

  resolveSpecialtyModule(
    specialty: string | null | undefined
  ): SpecialtyModuleDefinition | null {
    const normalizedSpecialty = this.normalize(specialty);
    if (!normalizedSpecialty) {
      return null;
    }

    const matched = SPECIALTY_MODULES.find((module) =>
      module.aliases.some((alias) => normalizedSpecialty.includes(this.normalize(alias)))
    );

    return matched ?? null;
  }
}
