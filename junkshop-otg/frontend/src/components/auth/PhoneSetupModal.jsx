import { useState } from 'react';
import { authApi } from '../../services/api';
import { authInputClass, authLabelClass, authSubmitClass } from './authModalUi';

export default function PhoneSetupModal({ user, onComplete }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const normalized = phone.replace(/\D/g, '').slice(0, 11);
    if (!/^09\d{9}$/.test(normalized)) {
      setError('Enter a valid mobile number (09XXXXXXXXX).');
      return;
    }

    setSaving(true);
    try {
      const { user: updated } = await authApi.updateMe({ phone: normalized });
      onComplete?.(updated);
    } catch (err) {
      setError(err.message || 'Could not save your mobile number.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-charcoal">Add your mobile number</h2>
        <p className="mt-2 text-sm text-charcoal/70">
          JunkShop uses your phone to log in and coordinate pickups. This only takes a moment.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="setup-phone" className={authLabelClass}>
              Mobile number <span className="text-red-500">*</span>
            </label>
            <input
              id="setup-phone"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))
              }
              placeholder="09XXXXXXXXX"
              className={authInputClass}
              disabled={saving}
              autoComplete="tel"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={saving} className={authSubmitClass}>
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
