const ALLOWED_SUBJECTS = [
  'General question',
  'Junkshop suggestion',
  'Issue report',
  'Feedback',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-zÀ-ÿÑñ\s.'-]{2,100}$/;

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

  if (name.length < 2 || name.length > 100 || !NAME_REGEX.test(name)) {
    return { ok: false, message: 'Please enter a valid name (2–100 characters).' };
  }

  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  if (subject.length < 3 || subject.length > 120) {
    return { ok: false, message: 'Subject must be 3–120 characters.' };
  }

  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { ok: false, message: 'Please choose a valid subject.' };
  }

  if (message.length < 10 || message.length > 2000) {
    return { ok: false, message: 'Message must be 10–2000 characters.' };
  }

  return {
    ok: true,
    data: { name, firstName, lastName, email, subject, message },
  };
}

module.exports = {
  ALLOWED_SUBJECTS,
  validateContactPayload,
};
