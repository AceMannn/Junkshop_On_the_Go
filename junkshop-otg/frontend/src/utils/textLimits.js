export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 2000;
export const CONTACT_NAME_MAX = 50;
export const CONTACT_EMAIL_MAX = 254;

export const GENERAL_MESSAGE_MAX = 1000;
export const GENERAL_MESSAGE_MIN = 10;
export const LANDMARK_MAX = 200;

export function clampText(value, max) {
  return String(value ?? '').slice(0, max);
}
