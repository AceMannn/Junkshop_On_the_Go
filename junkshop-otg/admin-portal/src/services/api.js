import { getToken, clearSession } from '../utils/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export class ApiError extends Error {
  constructor(message, { status, isNetworkError = false, sessionExpired = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.sessionExpired = sessionExpired;
  }
}

async function request(path, options = {}) {
  const token = getToken();
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
    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Make sure the backend is running.`,
      { isNetworkError: true }
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Something went wrong. Please try again.';

    if (response.status === 401 && token && !path.startsWith('/api/auth/login')) {
      clearSession();
      throw new ApiError(message, { status: 401, sessionExpired: true });
    }

    throw new ApiError(message, { status: response.status });
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
  me() {
    return request('/api/auth/me');
  },
};

export const adminApi = {
  getOverview() {
    return request('/api/admin/overview');
  },
  listApplications(status) {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/admin/applications${params}`);
  },
  getApplication(id) {
    return request(`/api/admin/applications/${id}`);
  },
  getApplicationDocument(id, kind, slot) {
    const slotPath = kind === 'shop-photos' && slot != null ? `/${slot}` : '';
    return request(`/api/admin/applications/${id}/documents/${kind}${slotPath}`);
  },
  approveApplication(id) {
    return request(`/api/admin/applications/${id}/approve`, { method: 'PATCH' });
  },
  rejectApplication(id, note) {
    return request(`/api/admin/applications/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  },
  requestReVerification(id, note) {
    return request(`/api/admin/applications/${id}/request-reverification`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  },
  listUsers(role) {
    const params = role ? `?role=${encodeURIComponent(role)}` : '';
    return request(`/api/admin/users${params}`);
  },
  updateUserBadges(id, badges) {
    return request(`/api/admin/users/${id}/badges`, {
      method: 'PATCH',
      body: JSON.stringify({ badges }),
    });
  },
  updateUserStatus(id, status, note) {
    return request(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },
  listTransactions() {
    return request('/api/admin/transactions');
  },
  listAuditLogs() {
    return request('/api/admin/audit-logs');
  },
  listDeletedRecords() {
    return request('/api/admin/deleted-records');
  },
  listAdminTeam() {
    return request('/api/admin/admin-team');
  },
  listContactMessages() {
    return request('/api/admin/contact-messages');
  },
  updateContactMessageStatus(id, status) {
    return request(`/api/admin/contact-messages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
