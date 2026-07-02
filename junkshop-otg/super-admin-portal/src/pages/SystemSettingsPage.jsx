import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Save, Shield } from 'lucide-react';
import { superAdminApi } from '../services/api';
import { actorRoleLabel, formatDate } from '../utils/format';
import {
  superCardClass,
  superInputClass,
  superPageTitleClass,
  superPrimaryButtonClass,
} from '../utils/superAdminUi';

const defaultForm = {
  platformName: '',
  supportEmail: '',
  maintenanceMode: false,
  maintenanceMessage: '',
  allowCustomerRegistration: true,
  allowProviderRegistration: true,
  allowPickupRequests: true,
};

function ToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:bg-zinc-50">
      <span>
        <span className="block text-sm font-semibold text-[#191c1c]">{label}</span>
        {description ? <span className="mt-1 block text-xs text-zinc-500">{description}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-zinc-300 text-[#006c49] focus:ring-[#006c49]/20"
      />
    </label>
  );
}

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [meta, setMeta] = useState({ updatedAt: null, updatedBy: null });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    superAdminApi
      .getSystemSettings()
      .then((data) => {
        if (cancelled) return;
        const settings = data.settings || {};
        setForm({
          platformName: settings.platformName || '',
          supportEmail: settings.supportEmail || '',
          maintenanceMode: Boolean(settings.maintenanceMode),
          maintenanceMessage: settings.maintenanceMessage || '',
          allowCustomerRegistration: Boolean(settings.allowCustomerRegistration),
          allowProviderRegistration: Boolean(settings.allowProviderRegistration),
          allowPickupRequests: Boolean(settings.allowPickupRequests),
        });
        setMeta({
          updatedAt: settings.updatedAt || null,
          updatedBy: settings.updatedBy || null,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load system settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await superAdminApi.updateSystemSettings(form);
      const settings = data.settings || {};
      setForm({
        platformName: settings.platformName || '',
        supportEmail: settings.supportEmail || '',
        maintenanceMode: Boolean(settings.maintenanceMode),
        maintenanceMessage: settings.maintenanceMessage || '',
        allowCustomerRegistration: Boolean(settings.allowCustomerRegistration),
        allowProviderRegistration: Boolean(settings.allowProviderRegistration),
        allowPickupRequests: Boolean(settings.allowPickupRequests),
      });
      setMeta({
        updatedAt: settings.updatedAt || null,
        updatedBy: settings.updatedBy || null,
      });
      setSuccess(data.message || 'System settings saved.');
    } catch (err) {
      setError(err.message || 'Could not save system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={superPageTitleClass}>System Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure platform branding, maintenance mode, and public registration behavior.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          className={`${superPrimaryButtonClass} gap-2`}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>

      {form.maintenanceMode ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Maintenance mode is <strong>ON</strong>. Customers and providers cannot sign in or book
            pickups until you turn it off.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading settings...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={`${superCardClass} space-y-4 p-5`}>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-[#006c49]" />
              <h2 className="text-lg font-bold text-[#191c1c]">Platform</h2>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Platform name
              </span>
              <input
                type="text"
                value={form.platformName}
                onChange={(e) => updateField('platformName', e.target.value)}
                className={superInputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Support email
              </span>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(e) => updateField('supportEmail', e.target.value)}
                className={superInputClass}
              />
            </label>
          </section>

          <section className={`${superCardClass} space-y-4 p-5`}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <h2 className="text-lg font-bold text-[#191c1c]">Maintenance</h2>
            </div>

            <ToggleRow
              label="Maintenance mode"
              description="Blocks customer and provider login, registration, and new pickup requests."
              checked={form.maintenanceMode}
              onChange={(value) => updateField('maintenanceMode', value)}
            />

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Maintenance message
              </span>
              <textarea
                value={form.maintenanceMessage}
                onChange={(e) => updateField('maintenanceMessage', e.target.value)}
                rows={4}
                className={`${superInputClass} resize-y`}
              />
            </label>
          </section>

          <section className={`${superCardClass} space-y-4 p-5 lg:col-span-2`}>
            <h2 className="text-lg font-bold text-[#191c1c]">Registration & services</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <ToggleRow
                label="Customer registration"
                description="Allow new customer sign-ups on the public app."
                checked={form.allowCustomerRegistration}
                onChange={(value) => updateField('allowCustomerRegistration', value)}
              />
              <ToggleRow
                label="Provider registration"
                description="Allow new junkshop owner sign-ups."
                checked={form.allowProviderRegistration}
                onChange={(value) => updateField('allowProviderRegistration', value)}
              />
              <ToggleRow
                label="Pickup requests"
                description="Allow customers to submit pickup and drop-off bookings."
                checked={form.allowPickupRequests}
                onChange={(value) => updateField('allowPickupRequests', value)}
              />
            </div>
          </section>

          {meta.updatedAt ? (
            <section className={`${superCardClass} p-5 text-sm text-zinc-600 lg:col-span-2`}>
              Last updated {formatDate(meta.updatedAt)}
              {meta.updatedBy?.name ? (
                <>
                  {' '}
                  by {meta.updatedBy.name}
                  {meta.updatedBy.role ? ` (${actorRoleLabel(meta.updatedBy.role)})` : ''}
                </>
              ) : null}
              .
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
