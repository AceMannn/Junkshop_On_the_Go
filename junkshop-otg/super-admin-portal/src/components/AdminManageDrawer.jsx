import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Trash2, X } from 'lucide-react';
import { superAdminApi } from '../services/api';
import { formatDate, statusPillClass } from '../utils/format';
import {
  superInputClass,
  superPrimaryButtonClass,
  superSecondaryButtonClass,
} from '../utils/superAdminUi';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  status: 'active',
};

export default function AdminManageDrawer({ admin, mode = 'edit', onClose, onSaved }) {
  const isCreate = mode === 'create';
  const [form, setForm] = useState(emptyForm);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (isCreate) {
      setForm(emptyForm);
    } else {
      setForm({
        firstName: admin?.firstName || '',
        lastName: admin?.lastName || '',
        email: admin?.email || '',
        password: '',
        status: admin?.status || 'active',
      });
    }
    setNewPassword('');
    setShowPassword(false);
    setShowResetPassword(false);
    setError('');
  }, [admin, isCreate]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isCreate) {
        await superAdminApi.createAdmin({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await superAdminApi.updateAdmin(admin.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          status: form.status,
        });

        if (showResetPassword && newPassword.trim()) {
          await superAdminApi.updateAdminPassword(admin.id, newPassword);
        }
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save admin account.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    const confirmed = window.confirm(
      `Remove admin "${admin?.name || admin?.email}"? They will lose portal access until restored from Deleted Records.`
    );
    if (!confirmed) return;

    setRemoving(true);
    setError('');
    try {
      await superAdminApi.deleteAdmin(admin.id);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not remove admin account.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="dialog" aria-modal="true">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#006c49]">Admin account</p>
            <h2 className="text-lg font-bold text-[#191c1c]">
              {isCreate ? 'Create admin' : admin?.name || 'Manage admin'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="scroll-y-clean flex-1 space-y-4 overflow-y-auto p-5">
          {!isCreate && admin ? (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                  admin.status
                )}`}
              >
                {admin.status}
              </span>
              <span className="text-xs text-zinc-500">Joined {formatDate(admin.createdAt)}</span>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                First name
              </span>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className={superInputClass}
                autoComplete="given-name"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Last name
              </span>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className={superInputClass}
                autoComplete="family-name"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Email
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={superInputClass}
              autoComplete="email"
            />
          </label>

          {isCreate ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Temporary password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className={`${superInputClass} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                At least 10 characters with upper, lower, number, and symbol.
              </p>
            </label>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Account status
                </span>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className={superInputClass}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deleted">Deleted</option>
                </select>
              </label>

              <div className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#191c1c]">Reset password</p>
                    <p className="text-xs text-zinc-500">Set a new temporary password for this admin.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    className={superSecondaryButtonClass}
                  >
                    {showResetPassword ? 'Cancel' : 'Reset'}
                  </button>
                </div>
                {showResetPassword ? (
                  <div className="relative mt-3">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className={`${superInputClass} pr-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || removing}
            className={`${superPrimaryButtonClass} gap-2`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving...' : isCreate ? 'Create admin' : 'Save changes'}
          </button>
          <button type="button" onClick={onClose} className={superSecondaryButtonClass}>
            Cancel
          </button>
          {!isCreate && admin?.status !== 'deleted' ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving || removing}
              className="ml-auto inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {removing ? 'Removing...' : 'Remove admin'}
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
