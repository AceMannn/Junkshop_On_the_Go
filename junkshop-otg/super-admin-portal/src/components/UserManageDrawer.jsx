import { useEffect, useState } from 'react';
import { BadgeCheck, Loader2, X } from 'lucide-react';
import { superAdminApi } from '../services/api';
import { formatDate, statusPillClass } from '../utils/format';
import {
  superCardClass,
  superInputClass,
  superPrimaryButtonClass,
  superSecondaryButtonClass,
} from '../utils/superAdminUi';

export default function UserManageDrawer({ user, badgeOptions, onClose, onUpdated, onViewApplication }) {
  const [error, setError] = useState('');
  const [status, setStatus] = useState(user?.status || 'active');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [badges, setBadges] = useState(user?.badges || []);

  useEffect(() => {
    setStatus(user?.status || 'active');
    setBadges(user?.badges || []);
    setNote('');
    setError('');
  }, [user]);

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

  if (!user) return null;

  const handleSaveStatus = async () => {
    if (status === 'deleted') {
      const confirmed = window.confirm(
        'Soft-delete this account? It can be restored from Deleted Records.'
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setError('');
    try {
      await superAdminApi.updateUserStatus(user.id, status, note.trim());
      onUpdated?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not update account status.');
    } finally {
      setSaving(false);
    }
  };

  const handleBadgeToggle = async (badgeId) => {
    if (badgeId === 'verified') return;

    const next = badges.includes(badgeId)
      ? badges.filter((item) => item !== badgeId)
      : [...badges, badgeId];
    const previous = badges;
    setBadges(next);

    try {
      await superAdminApi.updateUserBadges(user.id, next);
      onUpdated?.();
    } catch (err) {
      setBadges(previous);
      setError(err.message || 'Could not update badges.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close user panel"
        onClick={onClose}
      />

      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-bold text-[#191c1c]">Manage User</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="font-semibold text-[#191c1c]">{user.name || user.email}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
            {user.phone && <p className="text-sm text-zinc-500">{user.phone}</p>}
            {user.junkshopName && (
              <p className="mt-1 text-sm text-zinc-600">{user.junkshopName}</p>
            )}
            <p className="mt-2 text-xs text-zinc-400">Joined {formatDate(user.createdAt)}</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <section className={`${superCardClass} space-y-3 p-4`}>
            <h3 className="text-sm font-bold text-[#191c1c]">Account status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={superInputClass}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="deleted">Deleted</option>
            </select>
            <label className="block text-sm font-medium text-zinc-600">
              Moderation note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={superInputClass}
              placeholder="Reason for suspend, ban, or delete..."
            />
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                status
              )}`}
            >
              Preview: {status}
            </span>
          </section>

          {user.role === 'provider' && badgeOptions.length > 0 && (
            <section className={`${superCardClass} space-y-3 p-4`}>
              <h3 className="text-sm font-bold text-[#191c1c]">Provider badges</h3>
              <div className="flex flex-wrap gap-2">
                {badgeOptions.map((badge) => {
                  const active = badges.includes(badge.id);
                  const locked = badge.id === 'verified';
                  return (
                    <button
                      key={badge.id}
                      type="button"
                      disabled={locked}
                      onClick={() => handleBadgeToggle(badge.id)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        locked
                          ? 'cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-800 opacity-80'
                          : active
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <BadgeCheck size={14} />
                      {badge.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4 sm:flex-row sm:justify-end">
          {user.role === 'provider' && (
            <button
              type="button"
              onClick={() => onViewApplication?.(user.id)}
              className={superSecondaryButtonClass}
            >
              View application
            </button>
          )}
          <button type="button" onClick={onClose} className={superSecondaryButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveStatus}
            disabled={saving}
            className={superPrimaryButtonClass}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save status
          </button>
        </div>
      </div>
    </div>
  );
}
