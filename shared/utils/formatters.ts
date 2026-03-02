// Shared formatting utilities
export function formatCurrency(amount: number, currency: string = 'PYG'): string {
  return `${currency} ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

export function formatDate(dateString: string, locale: string = 'es-PY'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale);
}

export function formatDateTime(dateString: string, locale: string = 'es-PY'): string {
  const date = new Date(dateString);
  return date.toLocaleString(locale);
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
