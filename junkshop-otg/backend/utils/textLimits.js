const CONTACT_MESSAGE_MIN = 10;
const CONTACT_MESSAGE_MAX = 2000;
const CONTACT_NAME_MAX = 50;
const CONTACT_EMAIL_MAX = 254;

const GENERAL_MESSAGE_MAX = 1000;
const GENERAL_MESSAGE_MIN = 10;
const LANDMARK_MAX = 200;

function clampText(value, max) {
  return String(value ?? '').slice(0, max);
}

function trimText(value, max) {
  return clampText(value, max).trim();
}

function validateOptionalText(value, max, label = 'Text') {
  const text = trimText(value, max);
  if (!text) return { ok: true, value: '' };
  if (text.length > max) {
    return { ok: false, message: `${label} must be at most ${max} characters.` };
  }
  return { ok: true, value: text };
}

function validateRequiredText(value, { min = GENERAL_MESSAGE_MIN, max = GENERAL_MESSAGE_MAX, label = 'Message' } = {}) {
  const text = trimText(value, max);
  if (!text) {
    return { ok: false, message: `${label} is required.` };
  }
  if (text.length < min) {
    return { ok: false, message: `${label} must be at least ${min} characters.` };
  }
  if (text.length > max) {
    return { ok: false, message: `${label} must be at most ${max} characters.` };
  }
  return { ok: true, value: text };
}

module.exports = {
  CONTACT_MESSAGE_MIN,
  CONTACT_MESSAGE_MAX,
  CONTACT_NAME_MAX,
  CONTACT_EMAIL_MAX,
  GENERAL_MESSAGE_MAX,
  GENERAL_MESSAGE_MIN,
  LANDMARK_MAX,
  clampText,
  trimText,
  validateOptionalText,
  validateRequiredText,
};
