import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, MoreVertical, Search } from 'lucide-react';
import ApplicationReviewDrawer from '../components/ApplicationReviewDrawer';
import UserManageDrawer from '../components/UserManageDrawer';
import { superAdminApi } from '../services/api';
import { downloadSheet } from '../utils/exportSheet';
import {
  formatShortDate,
  rolePillClass,
  statusPillClass,
  userInitials,
} from '../utils/format';
import {
  superCardClass,
  superPageTitleClass,
  superPrimaryButtonClass,
} from '../utils/superAdminUi';
import { matchesPrefixWordSearch } from '../utils/searchFilter';

const PAGE_SIZE = 10;

function matchesSearch(row, query) {
  return matchesPrefixWordSearch(
    [row.name, row.email, row.phone, row.junkshopName, row.role],
    query
  );
}

function verificationLabel(status) {
  if (status === 'approved') return 'Verified';
  if (status === 'pending') return 'Pending';
  if (status === 'rejected') return 'Rejected';
  return status || '—';
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [badgeOptions, setBadgeOptions] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [manageUser, setManageUser] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const reloadUsers = () => {
    setLoading(true);
    setError('');
    return Promise.all([
      superAdminApi.getOverview(),
      superAdminApi.listUsers(roleFilter || undefined),
    ])
      .then(([overview, usersData]) => {
        setBadgeOptions(overview.badgeOptions || []);
        setUsers(usersData.users || []);
      })
      .catch((err) => setError(err.message || 'Could not load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      superAdminApi.getOverview(),
      superAdminApi.listUsers(roleFilter || undefined),
    ])
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

  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpenId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      return matchesSearch(row, query);
    });
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    downloadSheet(
      `users-${roleFilter || 'all'}`,
      ['Name', 'Email', 'Phone', 'Role', 'Junkshop', 'Account Status', 'Verification', 'Joined'],
      filtered.map((row) => [
        row.name,
        row.email,
        row.phone,
        row.role,
        row.junkshopName,
        row.status,
        verificationLabel(row.verificationStatus),
        formatShortDate(row.createdAt),
      ])
    );
  };

  const openManage = (row) => {
    setMenuOpenId(null);
    setManageUser(row);
  };

  const openApplication = (userId) => {
    setManageUser(null);
    setApplicationId(userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={superPageTitleClass}>Users Management</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage all registered accounts across the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className={`${superPrimaryButtonClass} gap-2`}
        >
          <Download size={16} />
          Download Sheet
        </button>
      </div>

      <div className={`${superCardClass} flex flex-col gap-4 p-4 lg:flex-row lg:items-center`}>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
          >
            <option value="">Role: All</option>
            <option value="customer">Customer</option>
            <option value="provider">Provider</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
          >
            <option value="">Status: All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading users...
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${superCardClass} px-4 py-16 text-center text-zinc-500`}>
          {search || statusFilter ? 'No users match your filters.' : 'No users found.'}
        </div>
      ) : (
        <div className={`${superCardClass} overflow-hidden`}>
          <div className="scroll-x-clean">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pageRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-zinc-50/80">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-600">
                          {userInitials(row.name, row.email)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#191c1c]">{row.name || row.email}</p>
                          <p className="truncate text-xs text-zinc-500">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${rolePillClass(
                          row.role
                        )}`}
                      >
                        {row.role === 'provider' ? 'Junkshop' : row.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-600">
                      {row.role === 'provider'
                        ? verificationLabel(row.verificationStatus)
                        : '—'}
                    </td>
                    <td className="relative px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId((current) => (current === row.id ? null : row.id));
                        }}
                        className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                        aria-label="User actions"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {menuOpenId === row.id && (
                        <div className="absolute right-6 top-12 z-20 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-left shadow-lg">
                          <button
                            type="button"
                            onClick={() => openManage(row)}
                            className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-50"
                          >
                            Manage account
                          </button>
                          {row.role === 'provider' && (
                            <button
                              type="button"
                              onClick={() => openApplication(row.id)}
                              className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-50"
                            >
                              View application
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-6 py-3 text-sm text-zinc-500">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length} entries
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1 transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1 transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {manageUser && (
        <UserManageDrawer
          user={manageUser}
          badgeOptions={badgeOptions}
          onClose={() => setManageUser(null)}
          onUpdated={reloadUsers}
          onViewApplication={openApplication}
        />
      )}

      {applicationId && (
        <ApplicationReviewDrawer
          applicationId={applicationId}
          onClose={() => setApplicationId(null)}
          onUpdated={reloadUsers}
        />
      )}
    </div>
  );
}
