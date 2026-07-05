const PREFIX = 'junkshop_otg_auth_draft_';

export const AUTH_DRAFT_KEYS = {
  LOGIN: 'login',
  SIGNUP_CUSTOMER: 'signup_customer',
  SIGNUP_PROVIDER: 'signup_provider',
  SIGNUP_META: 'signup_meta',
};

const CUSTOMER_FORM_DEFAULTS = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

function read(key) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore quota errors — draft is a convenience, not required.
  }
}

function remove(key) {
  sessionStorage.removeItem(PREFIX + key);
}

function omitSecrets(obj, secretKeys) {
  if (!obj || typeof obj !== 'object') return obj;
  const safe = { ...obj };
  secretKeys.forEach((key) => {
    delete safe[key];
  });
  return safe;
}

export function loadAuthDraft(key) {
  return read(key);
}

export function saveAuthDraft(key, value) {
  write(key, value);
}

export function clearAuthDraft(key) {
  remove(key);
}

export function clearLoginDraft() {
  clearAuthDraft(AUTH_DRAFT_KEYS.LOGIN);
}

export function clearSignUpDrafts() {
  clearAuthDraft(AUTH_DRAFT_KEYS.SIGNUP_CUSTOMER);
  clearAuthDraft(AUTH_DRAFT_KEYS.SIGNUP_PROVIDER);
  clearAuthDraft(AUTH_DRAFT_KEYS.SIGNUP_META);
}

/** Reset signup entry to customer without wiping in-progress form drafts. */
export function resetSignUpMetaRole() {
  saveAuthDraft(AUTH_DRAFT_KEYS.SIGNUP_META, { selectedRole: 'customer' });
}

/** Login: phone/email, role, view — never passwords or OTP codes. */
export function loadLoginDraft() {
  return read(AUTH_DRAFT_KEYS.LOGIN) || {};
}

export function saveLoginDraft(draft) {
  write(
    AUTH_DRAFT_KEYS.LOGIN,
    omitSecrets(draft, ['password', 'resetToken', 'newPassword'])
  );
}

/** Customer signup: profile fields only — never passwords. */
export function loadCustomerSignUpDraft() {
  const draft = read(AUTH_DRAFT_KEYS.SIGNUP_CUSTOMER);
  if (!draft?.formData) return null;

  return {
    step: draft.step || 'form',
    formData: {
      ...CUSTOMER_FORM_DEFAULTS,
      ...omitSecrets(draft.formData, ['password', 'confirmPassword']),
      password: '',
      confirmPassword: '',
    },
  };
}

export function saveCustomerSignUpDraft({ formData, step }) {
  write(AUTH_DRAFT_KEYS.SIGNUP_CUSTOMER, {
    step,
    formData: omitSecrets(formData, ['password', 'confirmPassword']),
  });
}

/** Provider signup: business + account fields — never passwords. */
export function loadProviderSignUpDraft() {
  const draft = read(AUTH_DRAFT_KEYS.SIGNUP_PROVIDER);
  if (!draft?.form) return null;

  return {
    step: draft.step ?? 1,
    form: {
      ...omitSecrets(draft.form, ['password', 'confirmPassword']),
      password: '',
      confirmPassword: '',
    },
  };
}

export function saveProviderSignUpDraft({ step, form }) {
  write(AUTH_DRAFT_KEYS.SIGNUP_PROVIDER, {
    step,
    form: omitSecrets(form, ['password', 'confirmPassword']),
  });
}
