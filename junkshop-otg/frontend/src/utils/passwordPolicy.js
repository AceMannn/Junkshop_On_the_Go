export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password must be at least 10 characters and include uppercase, lowercase, number, and special character.';

export function validatePasswordStrength(password) {
  const value = String(password || '');

  if (value.length < 10) {
    return { ok: false, message: PASSWORD_REQUIREMENTS_MESSAGE };
  }

  if (
    !/[A-Z]/.test(value) ||
    !/[a-z]/.test(value) ||
    !/\d/.test(value) ||
    !/[^A-Za-z0-9]/.test(value)
  ) {
    return { ok: false, message: PASSWORD_REQUIREMENTS_MESSAGE };
  }

  return { ok: true, message: '' };
}
