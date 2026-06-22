import { getToken, clearSession } from '../utils/authStorage';
import {
  getAccountStatusUserMessage,
  isAccountStatusMessage,
  notifyAccountSuspended,
  notifySessionExpired,
} from '../utils/authEvents';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AUTH_LOCAL_ERROR_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/password',
];

function isAuthLocalErrorPath(path) {
  return AUTH_LOCAL_ERROR_PATHS.some((prefix) => path.startsWith(prefix));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ApiError extends Error {
  constructor(
    message,
    {
      status,
      isNetworkError = false,
      sessionExpired = false,
      accountSuspended = false,
      requiresEmailVerification = false,
      email = '',
    } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.sessionExpired = sessionExpired;
    this.accountSuspended = accountSuspended;
    this.requiresEmailVerification = requiresEmailVerification;
    this.email = email;
  }
}

async function request(path, options = {}, attempt = 0) {
  const token = getToken();
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    if (method === 'GET' && attempt === 0) {
      await sleep(800);
      return request(path, options, 1);
    }

    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Make sure the backend is running (npm run dev in junkshop-otg).`,
      { isNetworkError: true }
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Something went wrong. Please try again.';

    if (response.status === 401 && token && !isAuthLocalErrorPath(path)) {
      clearSession();
      notifySessionExpired(message || 'Session expired. Please log in again.');
      throw new ApiError(message, { status: 401, sessionExpired: true });
    }

    if (response.status === 403 && token && isAccountStatusMessage(message)) {
      clearSession();
      const userMessage = getAccountStatusUserMessage();
      notifyAccountSuspended(userMessage);
      throw new ApiError(userMessage, { status: 403, accountSuspended: true });
    }

    throw new ApiError(message, {
      status: response.status,
      requiresEmailVerification: Boolean(data.requiresEmailVerification),
      email: data.email || '',
    });
  }

  return data;
}

export const authApi = {
  login(payload) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  register(payload) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  verifyEmail(payload) {
    return request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  resendVerification(payload) {
    return request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  me() {
    return request('/api/auth/me');
  },
  updateMe(payload) {
    return request('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  changePassword(payload) {
    return request('/api/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deactivate() {
    return request('/api/auth/deactivate', { method: 'PATCH' });
  },
  getFavorites() {
    return request('/api/auth/favorites');
  },
  toggleFavorite(shopId) {
    return request('/api/auth/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ shopId }),
    });
  },
  forgotPassword(payload) {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  resetPassword(payload) {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};


export const contactApi = {
  sendMessage(payload) {
    return request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const domainApi = {
  getJunkshops({ lat, lng, partnersOnly } = {}) {
    const params = new URLSearchParams();
    if (lat != null && lng != null) {
      params.set('lat', String(lat));
      params.set('lng', String(lng));
    }
    if (partnersOnly) params.set('partners', 'true');
    const qs = params.toString();
    return request(`/api/junkshops${qs ? `?${qs}` : ''}`);
  },
  getMyJunkshops() {
    return request('/api/junkshops/mine');
  },
  createJunkshop(payload) {
    return request('/api/junkshops', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateJunkshop(id, payload) {
    return request(`/api/junkshops/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  getJunkshopReviews(id, { limit = 5 } = {}) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return request(`/api/junkshops/${id}/reviews${qs ? `?${qs}` : ''}`);
  },
  getCatalogMaterials() {
    return request('/api/materials?catalog=true');
  },
  getFeaturedMaterials() {
    return request('/api/materials?featured=true');
  },
  getMyMaterials() {
    return request('/api/materials/mine');
  },
  createMaterial(payload) {
    return request('/api/materials', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateMaterial(id, payload) {
    return request(`/api/materials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteMaterial(id) {
    return request(`/api/materials/${id}`, { method: 'DELETE' });
  },
  getTransactions({ from, to } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request(`/api/transactions${qs ? `?${qs}` : ''}`);
  },
  createTransaction(payload) {
    return request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  logTrip(payload) {
    return request('/api/transactions/log-trip', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getNotes() {
    return request('/api/notes');
  },
  createNote(payload) {
    return request('/api/notes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const pickupApi = {
  list() {
    return request('/api/pickup-requests');
  },
  get(id) {
    return request(`/api/pickup-requests/${id}`);
  },
  getRejectPresets() {
    return request('/api/pickup-requests/reject-presets');
  },
  create(payload) {
    return request('/api/pickup-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  accept(id, payload = {}) {
    return request(`/api/pickup-requests/${id}/accept`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  reject(id, payload) {
    return request(`/api/pickup-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  updateStatus(id, status, extra = {}) {
    return request(`/api/pickup-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    });
  },
  updateLocation(id, lat, lng) {
    return request(`/api/pickup-requests/${id}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    });
  },
  markServiceFeePaid(id) {
    return request(`/api/pickup-requests/${id}/service-fee-paid`, { method: 'PATCH' });
  },
  submitPaymentProof(id, payload) {
    return request(`/api/pickup-requests/${id}/payment-proof`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  confirmReadyForPickup(id) {
    return request(`/api/pickup-requests/${id}/confirm-ready`, { method: 'POST' });
  },
  confirmPayment(id) {
    return request(`/api/pickup-requests/${id}/payment-confirm`, { method: 'PATCH' });
  },
  rejectPayment(id, payload = {}) {
    return request(`/api/pickup-requests/${id}/payment-reject`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  rate(id, payload) {
    return request(`/api/pickup-requests/${id}/rating`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const mapApi = {
  geocode(query) {
    const params = new URLSearchParams({ q: query });
    return request(`/api/maps/geocode?${params}`);
  },
  reverseGeocode(lat, lng) {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });
    return request(`/api/maps/reverse-geocode?${params}`);
  },
  route(fromLat, fromLng, toLat, toLng) {
    const params = new URLSearchParams({
      fromLat: String(fromLat),
      fromLng: String(fromLng),
      toLat: String(toLat),
      toLng: String(toLng),
    });
    return request(`/api/maps/route?${params}`);
  },
};

export const notificationApi = {
  list() {
    return request('/api/notifications');
  },
  markRead(id) {
    return request(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },
  clearAll() {
    return request('/api/notifications', { method: 'DELETE' });
  },
};

export const authApiExtended = {
  updateProviderProfile(payload) {
    return request('/api/auth/provider-profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};

export const verificationApi = {
  getMe() {
    return request('/api/verification/me');
  },
  saveDocuments(payload) {
    return request('/api/verification/documents', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  submit() {
    return request('/api/verification/submit', { method: 'POST' });
  },
};
