export function normalizePhilippinePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(0, 11);
}

export function hasValidPhilippinePhone(phone) {
  return /^09\d{9}$/.test(normalizePhilippinePhone(phone));
}

export const TRANSACTION_PHONE_SETTINGS_MESSAGE =
  'Add your mobile number in Account Settings before continuing.';
