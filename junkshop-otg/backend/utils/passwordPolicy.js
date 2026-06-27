const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password must be at least 10 characters and include uppercase, lowercase, and a number. Avoid common passwords like password, qwerty, or test123.';

const COMMON_PASSWORD_PARTS = [
  'password',
  'passw0rd',
  'qwerty',
  'admin',
  'letmein',
  'welcome',
  'test',
  'junkshop',
  '123456',
  '12345678',
  '123456789',
];

function validatePasswordStrength(password) {
  const value = String(password || '');
  const lower = value.toLowerCase();

  if (value.length < 10) {
    return { ok: false, message: PASSWORD_REQUIREMENTS_MESSAGE };
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return { ok: false, message: PASSWORD_REQUIREMENTS_MESSAGE };
  }

  if (COMMON_PASSWORD_PARTS.some((part) => lower.includes(part))) {
    return { ok: false, message: PASSWORD_REQUIREMENTS_MESSAGE };
  }

  return { ok: true, message: '' };
}

module.exports = {
  PASSWORD_REQUIREMENTS_MESSAGE,
  validatePasswordStrength,
};
