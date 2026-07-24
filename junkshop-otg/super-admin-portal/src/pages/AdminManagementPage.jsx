import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Plus, Search, UserCog } from 'lucide-react';
import AdminManageDrawer from '../components/AdminManageDrawer';
import { superAdminApi } from '../services/api';
import { downloadSheet } from '../utils/exportSheet';
import { formatShortDate, rolePillClass, statusPillClass, userInitials } from '../utils/format';
import {
  superCardClass,
  superFilterPillClass,
  superPageTitleClass,
  superPrimaryButtonClass,
} from '../utils/superAdminUi';
import { matchesPrefixWordSearch } from '../utils/searchFilter';

const PAGE_SIZE = 10;

const statusFilters = [
  { id: '', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'deleted', label: 'Deleted' },
];

function matchesSearch(row, query) {
  return matchesPrefixWordSearch(
    [row.name, row.firstName, row.lastName, row.email, row.status],
    query
  );
}

export default function AdminManagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const reloadAdmins = () => {
    setLoading(true);
    setError('');
    return superAdminApi
      .listAdmins()
      .then((data) => setAdmins(data.admins || []))
      .catch((err) => setError(err.message || 'Could not load admin accounts.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    superAdminApi
      .listAdmins()
      .then((data) => {
        if (!cancelled) setAdmins(data.admins || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load admin accounts.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return admins.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      return matchesSearch(row, query);
    });
  }, [admins, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = admins.filter((row) => row.status === 'active' && !row.deletedAt).length;

  const handleExport = () => {
    downloadSheet(
      'admin-accounts',
      ['Name', 'Email', 'Status', 'Created', 'Deleted At'],
      filtered.map((row) => [
        row.name,
        row.email,
        row.status,
        formatShortDate(row.createdAt),
        row.deletedAt ? formatShortDate(row.deletedAt) : '',
      ])
    );
  };

  const openCreate = () => {
    setSelectedAdmin(null);
    setDrawerMode('create');
  };

  const openManage = (admin) => {
    setSelectedAdmin(admin);
    setDrawerMode('edit');
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedAdmin(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={superPageTitleClass}>Admin Management</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create and manage regular admin accounts. Super admin accounts cannot be created here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className={`${superPrimaryButtonClass} gap-2 border border-[#006c49] bg-white text-[#006c49] hover:bg-emerald-50`}
          >
            <Download size={16} />
            Download Sheet
          </button>
          <button type="button" onClick={openCreate} className={`${superPrimaryButtonClass} gap-2`}>
            <Plus size={16} />
            Add admin
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${superCardClass} p-4`}>
          <p className="text-sm text-zinc-500">Active admins</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1c]">{activeCount}</p>
        </div>
        <div className={`${superCardClass} p-4`}>
          <p className="text-sm text-zinc-500">Total admin accounts</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1c]">{admins.length}</p>
        </div>
        <div className={`${superCardClass} p-4`}>
          <p className="text-sm text-zinc-500">Suspended</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1c]">
            {admins.filter((row) => row.status === 'suspended').length}
          </p>
        </div>
      </div>

      <div className={`${superCardClass} flex flex-col gap-4 p-4 lg:flex-row lg:items-center`}>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search admins by name or email..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item.id || 'all'}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={superFilterPillClass(statusFilter === item.id)}
            >
              {item.label}
            </button>
          ))}
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
          Loading admin accounts...
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${superCardClass} px-4 py-16 text-center text-zinc-500`}>
          {search || statusFilter ? (
            'No admin accounts match your filters.'
          ) : (
            <div className="space-y-3">
              <UserCog className="mx-auto h-8 w-8 text-zinc-300" />
              <p>No admin accounts yet. Create the first regular admin.</p>
              <button type="button" onClick={openCreate} className={`${superPrimaryButtonClass} gap-2`}>
                <Plus size={16} />
                Add admin
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          {pageRows.map((row) => (
            <article key={row.id} className={`${superCardClass} p-4 space-y-3`}>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">
                  {userInitials(row.name, row.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#191c1c]">{row.name}</p>
                  <p className="truncate text-sm text-zinc-500">{row.email}</p>
                  <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(row.status)}`}>
                    {row.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-500">Created {formatShortDate(row.createdAt)}</p>
              <button type="button" onClick={() => openManage(row)} className="text-sm font-semibold text-[#006c49] hover:underline">
                Manage
              </button>
            </article>
          ))}
          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1 disabled:opacity-50">Prev</button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
        <div className={`${superCardClass} hidden md:block overflow-hidden`}>
          <div className="scroll-x-clean">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pageRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-zinc-50/80">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">
                          {userInitials(row.name, row.email)}
                        </span>
                        <div>
                          <p className="font-medium text-[#191c1c]">{row.name}</p>
                          <span
                            className={`mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rolePillClass(
                              'admin'
                            )}`}
                          >
                            Admin
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-600">{row.email}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-600">{formatShortDate(row.createdAt)}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openManage(row)}
                        className="text-sm font-semibold text-[#006c49] transition-colors hover:text-[#005236] hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hidden md:flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-6 py-3 text-sm text-zinc-500">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length} results
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {drawerMode && (
        <AdminManageDrawer
          mode={drawerMode}
          admin={selectedAdmin}
          onClose={closeDrawer}
          onSaved={reloadAdmins}
        />
      )}
    </div>
  );
}
