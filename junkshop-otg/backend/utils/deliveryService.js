const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const { normalizePhone } = require('./profileCompletion');

const APP_NAME = 'JunkShop On-The-Go';

function isEmailConfigured() {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
}

function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

function getTwilioClient() {
  if (!isSmsConfigured()) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function toE164Philippines(phone) {
  const normalized = normalizePhone(phone);
  if (!/^09\d{9}$/.test(normalized)) return null;
  return `+63${normalized.slice(1)}`;
}

async function sendEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    console.log(`[email:stub] to=${to} subject=${subject}\n${text}`);
    return { ok: true, stub: true };
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
  });

  return { ok: true, stub: false };
}

async function sendSms({ to, body }) {
  const e164 = toE164Philippines(to) || to;

  if (!isSmsConfigured()) {
    console.log(`[sms:stub] to=${e164} body=${body}`);
    return { ok: true, stub: true };
  }

  const client = getTwilioClient();
  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: e164,
  });

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
  sendEmailVerificationEmail,
  sendTransactionalEmail,
  sendTransactionalSms,
};
