import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import { formatDate, statusPillClass } from '../utils/format';
import {
  adminCardClass,
  adminPageTitleClass,
  adminSecondaryButtonClass,
  adminSelectClass,
} from '../utils/adminUi';

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [badgeOptions, setBadgeOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([adminApi.getOverview(), adminApi.listUsers(roleFilter || undefined)])
      .then(([overview, usersData]) => {
        if (cancelled) return;
        setBadgeOptions(overview.badgeOptions || []);
        setUsers(usersData.users || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load users.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roleFilter]);

  const handleBadgeToggle = async (userId, badgeId, currentBadges) => {
    if (badgeId === 'verified') return;

    const next = currentBadges.includes(badgeId)
      ? currentBadges.filter((item) => item !== badgeId)
      : [...currentBadges, badgeId];
    const previous = currentBadges;

    setUsers((prev) =>
      prev.map((row) => (row.id === userId ? { ...row, badges: next } : row))
    );
    try {
      await adminApi.updateUserBadges(userId, next);
    } catch (err) {
      setUsers((prevRows) =>
        prevRows.map((row) => (row.id === userId ? { ...row, badges: previous } : row))
      );
      setError(err.message || 'Could not update badges.');
    }
  };

  const handleUserStatus = async (userId, status) => {
    try {
      let note;
      if (status === 'suspended' || status === 'banned') {
        const entered = window.prompt('Optional note for this action (leave blank to skip):', '');
        if (entered === null) return;
        note = entered.trim();
      }

      await adminApi.updateUserStatus(userId, status, note);
      setUsers((prev) =>
        prev.map((row) => (row.id === userId ? { ...row, status } : row))
      );
    } catch (err) {
      setError(err.message || 'Could not update account status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={adminPageTitleClass}>Users</h1>
          <p className="mt-1 text-sm text-[#5c6658]">
            Manage customers, providers, badges, and account status.
          </p>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={adminSelectClass}
        >
          <option value="">Customers & providers</option>
          <option value="customer">Customers</option>
          <option value="provider">Providers</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className={`${adminCardClass} px-4 py-16 text-center text-zinc-500`}>
          No users found.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((row) => (
            <div key={row.id} className={`${adminCardClass} p-4 sm:p-5 space-y-3`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[#191c1c]">{row.name || row.email}</p>
                  <p className="text-sm text-zinc-500">
                    {row.email}
                    {row.phone ? ` · ${row.phone}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                        row.role
                      )}`}
                    >
                      {row.role}
                    </span>
                    {row.junkshopName && (
                      <span className="text-xs text-zinc-500">{row.junkshopName}</span>
                    )}
                    {row.verificationStatus && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                          row.verificationStatus
                        )}`}
                      >
                        {row.verificationStatus}
                      </span>
                    )}
                  </div>
                </div>
                <select
                  value={row.status}
                  onChange={(e) => handleUserStatus(row.id, e.target.value)}
                  className={adminSelectClass}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>

              {row.role === 'provider' && (
                <Link
                  to={`/applications/${row.id}`}
                  className={adminSecondaryButtonClass}
                >
                  View verification
                </Link>
              )}

              {row.role === 'provider' && badgeOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badgeOptions.map((badge) => {
                    const active = (row.badges || []).includes(badge.id);
                    const locked = badge.id === 'verified';
                    return (
                      <button
                        key={badge.id}
                        type="button"
                        disabled={locked}
                        onClick={() => handleBadgeToggle(row.id, badge.id, row.badges || [])}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          locked
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 cursor-not-allowed opacity-80'
                            : active
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                        }`}
                        title={
                          locked
                            ? 'Verified is controlled by application approval.'
                            : active
                              ? `Remove ${badge.label}`
                              : `Add ${badge.label}`
                        }
                      >
                        <BadgeCheck size={14} />
                        {badge.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-zinc-400">Joined {formatDate(row.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
