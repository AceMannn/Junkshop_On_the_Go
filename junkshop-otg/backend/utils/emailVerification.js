const {
  generateResetCode,
  hashResetCode,
  isValidResetCode,
  RESET_CODE_LENGTH,
} = require('./passwordRecovery');

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

function buildVerificationExpiry() {
  return new Date(Date.now() + VERIFICATION_TTL_MS);
}

function assignEmailVerificationCode(user) {
  const code = generateResetCode();
  user.emailVerificationCodeHash = hashResetCode(code);
  user.emailVerificationExpiresAt = buildVerificationExpiry();
  return code;
}

function clearEmailVerificationCode(user) {
  user.emailVerificationCodeHash = null;
  user.emailVerificationExpiresAt = null;
}

function isCustomerEmailVerified(user) {
  if (!user || user.role !== 'customer') {
    return true;
  }

  return user.emailVerified !== false;
}

function verifyEmailCode(user, code) {
  if (!isValidResetCode(code)) {
    return { ok: false, message: `Enter the ${RESET_CODE_LENGTH}-digit code from your email.` };
  }

  if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
    return { ok: false, message: 'No active verification code. Request a new one.' };
  }

  if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
    return { ok: false, message: 'Verification code expired. Request a new one.' };
  }

  const hashed = hashResetCode(String(code).trim());
  if (hashed !== user.emailVerificationCodeHash) {
    return { ok: false, message: 'Invalid verification code.' };
  }

  return { ok: true };
}

function maybeAttachDevVerificationCode(payload, code, delivery) {
  if (delivery?.stub && process.env.NODE_ENV !== 'production') {
    payload.devVerificationCode = code;
  }
  return payload;
}

module.exports = {
  RESET_CODE_LENGTH,
  VERIFICATION_TTL_MS,
  assignEmailVerificationCode,
  clearEmailVerificationCode,
  isCustomerEmailVerified,
  verifyEmailCode,
  maybeAttachDevVerificationCode,
};
