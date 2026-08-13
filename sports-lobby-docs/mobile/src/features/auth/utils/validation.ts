export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requiredMessage(label: string): string {
  return `${label} is required.`;
}

export function validatePhone(value: unknown): true | string {
  if (
    value &&
    typeof value === 'object' &&
    'nationalNumber' in value &&
    typeof value.nationalNumber === 'string' &&
    value.nationalNumber.trim().length >= 7
  ) {
    return true;
  }
  return 'Enter a valid phone number.';
}

export function validatePassword(value: unknown): true | string {
  return typeof value === 'string' && value.length >= 8
    ? true
    : 'Password must be at least 8 characters.';
}
