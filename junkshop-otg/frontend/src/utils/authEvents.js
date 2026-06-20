const ACCOUNT_STATUS_PATTERNS = [
  'account is not active',
  'account has been banned',
  'account is currently suspended',
];

let onSessionExpired = null;
let onAccountSuspended = null;

export function setAuthHandlers({ onSessionExpired: sessionHandler, onAccountSuspended: suspendedHandler } = {}) {
  onSessionExpired = sessionHandler || null;
  onAccountSuspended = suspendedHandler || null;
}

export function isAccountStatusMessage(message) {
  const normalized = String(message || '').toLowerCase();
  return ACCOUNT_STATUS_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function getAccountStatusUserMessage() {
  return 'Your account is not active. Please contact support if you need help.';
}

export function notifySessionExpired(message) {
  onSessionExpired?.(message);
}

export function notifyAccountSuspended(message) {
  onAccountSuspended?.(message);
}
