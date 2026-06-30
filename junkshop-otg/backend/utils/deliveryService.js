const { normalizePhone } = require('./profileCompletion');
const logger = require('./fileLogger');

const APP_NAME = 'JunkShop On-The-Go';
const BREVO_EMAIL_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_SMS_API_URL = 'https://api.brevo.com/v3/transactionalSMS/send';
const DEFAULT_SMS_SENDER = 'JunkShopOTG';

function cleanEnv(value) {
  return String(value || '').trim();
}

function hasUsableBrevoApiKey() {
  const apiKey = cleanEnv(process.env.BREVO_API_KEY);
  return Boolean(apiKey && apiKey !== 'PASTE_YOUR_BREVO_API_KEY_HERE');
}

function isEmailConfigured() {
  return Boolean(hasUsableBrevoApiKey() && cleanEnv(process.env.BREVO_FROM_EMAIL));
}

function isSmsConfigured() {
  return hasUsableBrevoApiKey();
}

function toBrevoSmsRecipient(phone) {
  const normalized = normalizePhone(phone);
  if (/^09\d{9}$/.test(normalized)) {
    return `63${normalized.slice(1)}`;
  }

  const digits = String(phone || '').replace(/\D/g, '');
  if (/^63\d{10}$/.test(digits)) {
    return digits;
  }

  return null;
}

async function sendEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    console.log(`[email:stub] to=${to} subject=${subject}\n${text}`);
    logger.warn('email.stub_delivery', {
      to,
      subject,
      reason: 'Brevo email is not configured or API key is placeholder.',
      body: process.env.NODE_ENV === 'production' ? '[hidden in production]' : text,
    });
    return { ok: true, stub: true };
  }

  const response = await fetch(BREVO_EMAIL_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': cleanEnv(process.env.BREVO_API_KEY),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_FROM_EMAIL,
        name: process.env.BREVO_FROM_NAME || APP_NAME,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html || text.replace(/\n/g, '<br>'),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Brevo email send failed (${response.status}): ${detail}`);
    error.code = 'BREVO_EMAIL_SEND_FAILED';
    error.status = response.status;
    logger.error('email.brevo_send_failed', error, {
      to,
      subject,
      brevoStatus: response.status,
      brevoResponse: detail,
      fromEmail: process.env.BREVO_FROM_EMAIL,
    });
    throw error;
  }

  logger.info('email.sent', {
    to,
    subject,
    provider: 'brevo',
    fromEmail: process.env.BREVO_FROM_EMAIL,
  });
  return { ok: true, stub: false };
}

async function sendSms({ to, body }) {
  if (!isSmsConfigured()) {
    throw new Error('Brevo SMS is not configured. Set BREVO_API_KEY before sending SMS.');
  }

  const recipient = toBrevoSmsRecipient(to);
  if (!recipient) {
    throw new Error('Brevo SMS recipient must be a valid Philippine mobile number.');
  }

  const response = await fetch(BREVO_SMS_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': cleanEnv(process.env.BREVO_API_KEY),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: process.env.BREVO_SMS_SENDER || DEFAULT_SMS_SENDER,
      recipient,
      content: body,
      type: 'transactional',
      tag: 'otp',
      unicodeEnabled: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Brevo SMS send failed (${response.status}): ${detail}`);
  }

  return { ok: true, stub: false };
}

async function sendPasswordResetEmail(email, code, firstName = '') {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const subject = `${APP_NAME} password reset code`;
  const text = [
    greeting,
    '',
    `Your password reset code is: ${code}`,
    '',
    'This code expires in 1 hour. If you did not request a reset, you can ignore this message.',
    '',
    `— ${APP_NAME}`,
  ].join('\n');

  return sendEmail({ to: email, subject, text });
}

async function sendPasswordResetSms(phone, code) {
  const body = `${APP_NAME}: Your password reset code is ${code}. Expires in 1 hour.`;
  return sendSms({ to: phone, body });
}

async function sendEmailVerificationEmail(email, code, firstName = '') {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const subject = `${APP_NAME} email verification code`;
  const text = [
    greeting,
    '',
    `Your email verification code is: ${code}`,
    '',
    'This code expires in 15 minutes. Enter it in the app to activate your account.',
    '',
    `— ${APP_NAME}`,
  ].join('\n');

  return sendEmail({ to: email, subject, text });
}

async function sendPhoneVerificationSms(phone, code) {
  const body = `${APP_NAME}: Your signup verification code is ${code}. Expires in 15 minutes.`;
  return sendSms({ to: phone, body });
}

async function sendPasswordChangedEmail(email, firstName = '') {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const subject = `${APP_NAME} — your password was changed`;
  const text = [
    greeting,
    '',
    'Your password was successfully changed.',
    '',
    'If you did not make this change, please contact support immediately.',
    '',
    `— ${APP_NAME}`,
  ].join('\n');

  return sendEmail({ to: email, subject, text });
}

async function sendMaterialExpiryWarningEmail(email, firstName = '', materialName = '') {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const subject = `${APP_NAME} material trash reminder`;
  const name = materialName || 'One of your materials';
  const text = [
    greeting,
    '',
    `${name} has been in your trash for almost 30 days.`,
    '',
    'It will be permanently deleted in about 3 days unless you restore it from your Materials trash.',
    '',
    `— ${APP_NAME}`,
  ].join('\n');

  return sendEmail({ to: email, subject, text });
}

async function sendTransactionalEmail(email, subject, message) {
  if (!email) return { ok: false, skipped: true };
  const text = `${message}\n\n— ${APP_NAME}`;
  return sendEmail({ to: email, subject: `${APP_NAME}: ${subject}`, text });
}

async function sendTransactionalSms(phone, message) {
  if (!phone) return { ok: false, skipped: true };
  const body = `${APP_NAME}: ${message}`;
  return sendSms({ to: phone, body });
}

module.exports = {
  isEmailConfigured,
  isSmsConfigured,
  sendPasswordResetEmail,
  sendPasswordResetSms,
  sendPasswordChangedEmail,
  sendMaterialExpiryWarningEmail,
  sendEmailVerificationEmail,
  sendPhoneVerificationSms,
  sendTransactionalEmail,
  sendTransactionalSms,
};
