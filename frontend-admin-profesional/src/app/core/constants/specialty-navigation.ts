const LEGACY_SPECIALTY_ALIASES: Record<string, string> = {
  odontology: '/odontology',
  psychology: '/psychology',
  psychopedagogy: '/psychopedagogy',
};

const SPECIALTY_ICON_OVERRIDES: Record<string, string> = {
  odontology: 'fitness-outline',
  psychology: 'happy-outline',
  psychopedagogy: 'school-outline',
};

export function normalizeSpecialtyKey(moduleKey: string | null | undefined): string | null {
  const normalized = String(moduleKey || '').trim().toLowerCase();
  return normalized || null;
}

export function resolveSpecialtyFrontendRoute(moduleKey: string | null | undefined): string {
  const normalized = normalizeSpecialtyKey(moduleKey);
  if (!normalized) {
    return '/dashboard';
  }
  return LEGACY_SPECIALTY_ALIASES[normalized] || `/${normalized}`;
}

export function resolveSpecialtyMenuIcon(moduleKey: string | null | undefined): string {
  const normalized = normalizeSpecialtyKey(moduleKey);
  if (!normalized) {
    return 'medkit-outline';
  }
  return SPECIALTY_ICON_OVERRIDES[normalized] || 'medkit-outline';
}

