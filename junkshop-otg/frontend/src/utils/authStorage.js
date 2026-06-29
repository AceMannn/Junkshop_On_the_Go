const TOKEN_KEY = 'junkshop_token';
const USER_KEY = 'junkshop_user';

function activeStorage() {
  return localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function persistSession({ token, user, rememberMe = false }) {
  const storage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  otherStorage.removeItem(TOKEN_KEY);
  otherStorage.removeItem(USER_KEY);
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function setStoredUser(user) {
  activeStorage().setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
