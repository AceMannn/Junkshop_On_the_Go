const crypto = require('crypto');
const User = require('../models/User');
const { hasValidPhone, normalizePhone } = require('./profileCompletion');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Standard OTP length — change here to adjust email/SMS codes and validation. */
const RESET_CODE_LENGTH = 6;

function generateResetCode() {
  const min = 10 ** (RESET_CODE_LENGTH - 1);
  const max = 10 ** RESET_CODE_LENGTH;
  return String(crypto.randomInt(min, max));
}

function isValidResetCode(code) {
  const pattern = new RegExp(`^\\d{${RESET_CODE_LENGTH}}$`);
  return pattern.test(String(code || '').trim());
}

function hashResetCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function parseRecoveryIdentifier(raw) {
  const value = String(raw || '').trim();

  if (!value) {
    return { ok: false, message: 'Email or mobile number is required.' };
  }

  if (value.includes('@')) {
    const email = value.toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return { ok: false, message: 'Please enter a valid email address.' };
    }
    return { ok: true, type: 'email', email, phone: null, label: email };
  }

  const phone = normalizePhone(value);
  if (!hasValidPhone(phone)) {
    return {
      ok: false,
      message: 'Enter a valid email or mobile number (09XXXXXXXXX).',
    };
  }

  return { ok: true, type: 'phone', email: null, phone, label: phone };
}

function phoneLookupQuery(normalizedPhone) {
  const withoutLeadingZero = normalizedPhone.slice(1);
  return {
    $or: [
      { phone: normalizedPhone },
      { phone: `+63${withoutLeadingZero}` },
      { phone: `63${withoutLeadingZero}` },
    ],
  };
}

async function findUserByRecovery(parsed) {
  if (parsed.type === 'email') {
    return User.findOne({
      email: parsed.email,
      status: { $ne: 'deleted' },
      deletedAt: null,
    });
  }

  let user = await User.findOne({
    ...phoneLookupQuery(parsed.phone),
    status: { $ne: 'deleted' },
    deletedAt: null,
  });
  if (user) return user;

  const candidates = await User.find({
    phone: { $ne: '' },
    status: { $ne: 'deleted' },
    deletedAt: null,
  }).select('phone');
  const match = candidates.find((row) => normalizePhone(row.phone) === parsed.phone);
  if (!match) return null;
  return User.findById(match._id);
}

function resolveRecoveryInput(body) {
  const identifier = body?.identifier ?? body?.email ?? body?.phone ?? '';
  return parseRecoveryIdentifier(identifier);
}

module.exports = {
  RESET_CODE_LENGTH,
  generateResetCode,
  hashResetCode,
  isValidResetCode,
  parseRecoveryIdentifier,
  findUserByRecovery,
  resolveRecoveryInput,
};
