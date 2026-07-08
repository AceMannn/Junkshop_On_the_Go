const ALLOWED_SUBJECTS = [
  'General question',
  'Junkshop suggestion',
  'Issue report',
  'Feedback',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-zÀ-ÿÑñ\s.'-]{2,100}$/;
const {
  CONTACT_MESSAGE_MIN,
  CONTACT_MESSAGE_MAX,
  CONTACT_NAME_MAX,
  CONTACT_EMAIL_MAX,
  validateRequiredText,
} = require('./textLimits');

function validateContactPayload(body) {
  const firstName = String(body?.firstName || '').trim();
  const lastName = String(body?.lastName || '').trim();
  const legacyName = String(body?.name || '').trim();
  const name = [firstName, lastName].filter(Boolean).join(' ') || legacyName;
  const email = String(body?.email || '').trim().toLowerCase();
  const subject = String(body?.subject || '').trim();
  const message = String(body?.message || '').trim();

  if (!name || !email || !subject || !message) {
    return { ok: false, message: 'Please complete all contact fields.' };
  }

  if (!firstName && !legacyName) {
    return { ok: false, message: 'First name is required.' };
  }

  if (!lastName && !legacyName) {
    return { ok: false, message: 'Last name is required.' };
  }

  if (firstName.length > CONTACT_NAME_MAX) {
    return { ok: false, message: `First name must be at most ${CONTACT_NAME_MAX} characters.` };
  }

  if (lastName.length > CONTACT_NAME_MAX) {
    return { ok: false, message: `Last name must be at most ${CONTACT_NAME_MAX} characters.` };
  }

  if (name.length < 2 || name.length > 100 || !NAME_REGEX.test(name)) {
    return { ok: false, message: 'Please enter a valid name (2–100 characters).' };
  }

  if (!EMAIL_REGEX.test(email) || email.length > CONTACT_EMAIL_MAX) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  if (subject.length < 3 || subject.length > 120) {
    return { ok: false, message: 'Subject must be 3–120 characters.' };
  }

  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { ok: false, message: 'Please choose a valid subject.' };
  }

  const messageValidation = validateRequiredText(message, {
    min: CONTACT_MESSAGE_MIN,
    max: CONTACT_MESSAGE_MAX,
    label: 'Message',
  });
  if (!messageValidation.ok) {
    return { ok: false, message: messageValidation.message };
  }

  return {
    ok: true,
    data: {
      name,
      firstName,
      lastName,
      email,
      subject,
      message: messageValidation.value,
    },
  };
}

module.exports = {
  ALLOWED_SUBJECTS,
  validateContactPayload,
};
