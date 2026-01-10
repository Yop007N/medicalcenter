// Shared validation utilities
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

export function isValidPhone(phone: string): boolean {
  const re = /^\+?1?\d{9,15}$/;
  return re.test(phone);
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
