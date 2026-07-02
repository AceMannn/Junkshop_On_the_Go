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

export const superAdminApi = {
  getOverview() {
    return request('/api/admin/overview');
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
  deleteContactMessage(id) {
    return request(`/api/admin/contact-messages/${id}`, {
      method: 'DELETE',
    });
  },
  listTransactions() {
    return request('/api/admin/transactions');
  },
  deleteTransaction(id) {
    return request(`/api/admin/transactions/${id}`, {
      method: 'DELETE',
    });
  },
  listAuditLogs() {
    return request('/api/admin/audit-logs');
  },
  listDeletedRecords() {
    return request('/api/admin/deleted-records');
  },
  restoreDeletedRecord(type, id) {
    return request(`/api/admin/deleted-records/${type}/${id}/restore`, {
      method: 'PATCH',
    });
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
  hardResetVerification(id, note) {
    return request(`/api/admin/applications/${id}/reset-verification`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  },
  listAdmins() {
    return request('/api/super-admin/admins');
  },
  createAdmin(payload) {
    return request('/api/super-admin/admins', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateAdmin(id, payload) {
    return request(`/api/super-admin/admins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  updateAdminPassword(id, password) {
    return request(`/api/super-admin/admins/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
  },
  deleteAdmin(id) {
    return request(`/api/super-admin/admins/${id}`, {
      method: 'DELETE',
    });
  },
  getSystemSettings() {
    return request('/api/super-admin/settings');
  },
  updateSystemSettings(payload) {
    return request('/api/super-admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  listExportCatalog() {
    return request('/api/super-admin/exports/datasets');
  },
  listExportHistory() {
    return request('/api/super-admin/exports/history');
  },
  runDataExports(datasets) {
    return request('/api/super-admin/exports', {
      method: 'POST',
      body: JSON.stringify({ datasets }),
    });
  },
  permanentlyDeleteRecord(type, id, confirmation) {
    return request(`/api/super-admin/deleted-records/${type}/${id}/permanent`, {
      method: 'DELETE',
      body: JSON.stringify({ confirmation }),
    });
  },
};
