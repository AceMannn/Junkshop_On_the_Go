const TOKEN_KEY = 'junkshop_token';
const USER_KEY = 'junkshop_user';

function migrateLegacyLocalStorage() {
  if (sessionStorage.getItem(TOKEN_KEY)) return;

  const legacyToken = localStorage.getItem(TOKEN_KEY);
  if (!legacyToken) return;

  sessionStorage.setItem(TOKEN_KEY, legacyToken);
  const legacyUser = localStorage.getItem(USER_KEY);
  if (legacyUser) sessionStorage.setItem(USER_KEY, legacyUser);

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  migrateLegacyLocalStorage();
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  migrateLegacyLocalStorage();
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function persistSession({ token, user }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setStoredUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
