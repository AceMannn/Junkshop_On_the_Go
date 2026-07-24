import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Loader2, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { superAdminApi } from '../services/api';
import { downloadSheet } from '../utils/exportSheet';
import {
  actorRoleLabel,
  formatDate,
  formatShortDate,
  rolePillClass,
  statusPillClass,
  typeLabel,
} from '../utils/format';
import {
  superCardClass,
  superFilterPillClass,
  superPageTitleClass,
  superPrimaryButtonClass,
  superSecondaryButtonClass,
} from '../utils/superAdminUi';
import { matchesPrefixWordSearch } from '../utils/searchFilter';

const PAGE_SIZE = 10;

const typeFilters = [
  { id: '', label: 'All types' },
  { id: 'users', label: 'Users' },
  { id: 'contacts', label: 'Contact' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'pickups', label: 'Pickups' },
  { id: 'materials', label: 'Materials' },
  { id: 'junkshops', label: 'Junkshops' },
  { id: 'notifications', label: 'Notifications' },
];

function shortId(id) {
  if (!id) return '—';
  return String(id).slice(-8).toUpperCase();
}

function deletedByLabel(record) {
  if (!record.deletedBy?.name) return 'Unknown';
  return record.deletedBy.name;
}

function matchesSearch(record, query) {
  return matchesPrefixWordSearch(
    [
      record.type,
      record.label,
      record.status,
      record.id,
      record.deletedBy?.name,
      record.deletedBy?.email,
      record.deletedBy?.role,
    ],
    query
  );
}

export default function DeletedRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [restoringKey, setRestoringKey] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    superAdminApi
      .listDeletedRecords()
      .then((data) => {
        if (!cancelled) setRecords(data.records || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load deleted records.');
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
    setSelectedRecord(null);
  }, [search, typeFilter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      if (typeFilter && record.type !== typeFilter) return false;
      return matchesSearch(record, query);
    });
  }, [records, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const restoreRecord = async (record) => {
    const confirmed = window.confirm(`Restore "${record.label}" back to the system?`);
    if (!confirmed) return;

    const restoreKey = `${record.type}:${record.id}`;
    setRestoringKey(restoreKey);
    setError('');
    try {
      await superAdminApi.restoreDeletedRecord(record.type, record.id);
      setRecords((prev) =>
        prev.filter((item) => item.id !== record.id || item.type !== record.type)
      );
      setSelectedRecord((prev) =>
        prev?.id === record.id && prev?.type === record.type ? null : prev
      );
    } catch (err) {
      setError(err.message || 'Could not restore record.');
    } finally {
      setRestoringKey('');
    }
  };

  const handleExport = () => {
    downloadSheet(
      'deleted-records',
      ['Type', 'Label', 'Status', 'Deleted At', 'Deleted By', 'Deleted By Role', 'Created At', 'Record ID'],
      filtered.map((record) => [
        typeLabel(record.type),
        record.label,
        record.status,
        formatDate(record.deletedAt),
        deletedByLabel(record),
        record.deletedBy?.role || '',
        formatDate(record.createdAt),
        record.id,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={superPageTitleClass}>Deleted Records</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Soft-deleted items stay in the database until restored or permanently removed.
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

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p>
          Restore records here when moderation was a mistake. For irreversible removal, use{' '}
          <Link
            to="/permanent-delete"
            className="font-semibold text-[#006c49] underline-offset-2 hover:underline"
          >
            Permanent Delete
          </Link>
          .
        </p>
      </div>

      <div className={`${superCardClass} flex flex-col gap-4 p-4`}>
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search label, type, deleted by..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((item) => (
            <button
              key={item.id || 'all-types'}
              type="button"
              onClick={() => setTypeFilter(item.id)}
              className={superFilterPillClass(typeFilter === item.id)}
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
          Loading deleted records...
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${superCardClass} px-4 py-16 text-center text-zinc-500`}>
          {search || typeFilter
            ? 'No deleted records match your filters.'
            : 'No deleted records found.'}
        </div>
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          {pageRows.map((record) => {
            const restoreKey = `${record.type}:${record.id}`;
            return (
              <article key={restoreKey} className={`${superCardClass} p-4 space-y-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
                      {typeLabel(record.type)}
                    </span>
                    <p className="mt-2 font-semibold text-[#191c1c]">{record.label}</p>
                    {record.status ? (
                      <span className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(record.status)}`}>
                        {record.status}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Deleted</p>
                    <p>{formatShortDate(record.deletedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Deleted by</p>
                    <p className="truncate">{deletedByLabel(record)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedRecord(record)} className="text-sm font-semibold text-[#006c49] hover:underline">
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => restoreRecord(record)}
                    disabled={restoringKey === restoreKey}
                    className={`${superSecondaryButtonClass} gap-1.5 px-3 py-1.5 text-xs`}
                  >
                    <RotateCcw size={14} />
                    {restoringKey === restoreKey ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              </article>
            );
          })}
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
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Label</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Deleted</th>
                  <th className="px-6 py-4">Deleted By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pageRows.map((record) => {
                  const restoreKey = `${record.type}:${record.id}`;
                  return (
                    <tr key={restoreKey} className="transition-colors hover:bg-zinc-50/80">
                      <td className="px-6 py-3">
                        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
                          {typeLabel(record.type)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-medium text-[#191c1c]">{record.label}</span>
                        <span className="mt-0.5 block font-mono text-xs text-zinc-400">
                          {shortId(record.id)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {record.status ? (
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3 text-zinc-600">{formatShortDate(record.deletedAt)}</td>
                      <td className="px-6 py-3">
                        <span className="text-[#191c1c]">{deletedByLabel(record)}</span>
                        {record.deletedBy?.role ? (
                          <span
                            className={`mt-1 block w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rolePillClass(
                              record.deletedBy.role
                            )}`}
                          >
                            {actorRoleLabel(record.deletedBy.role)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(record)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006c49] transition-colors hover:text-[#005236] hover:underline"
                          >
                            <Eye size={15} />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => restoreRecord(record)}
                            disabled={restoringKey === restoreKey}
                            className={`${superSecondaryButtonClass} gap-1.5 px-3 py-1.5 text-xs`}
                          >
                            <RotateCcw size={14} />
                            {restoringKey === restoreKey ? 'Restoring...' : 'Restore'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {selectedRecord && (
        <DeletedRecordDrawer
          record={selectedRecord}
          restoring={restoringKey === `${selectedRecord.type}:${selectedRecord.id}`}
          onClose={() => setSelectedRecord(null)}
          onRestore={restoreRecord}
        />
      )}
    </div>
  );
}

function DeletedRecordDrawer({ record, onClose, onRestore, restoring }) {
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#006c49]">Deleted record</p>
            <h2 className="text-lg font-bold text-[#191c1c] break-words">{record.label}</h2>
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

        <div className="scroll-y-clean flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
              {typeLabel(record.type)}
            </span>
            {record.status ? (
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                  record.status
                )}`}
              >
                {record.status}
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Record ID" value={record.id} mono />
            <DetailField label="Created" value={formatDate(record.createdAt)} />
            <DetailField label="Deleted at" value={formatDate(record.deletedAt)} />
            <DetailField label="Deleted by" value={deletedByLabel(record)} />
          </div>

          {record.deletedBy ? (
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Deleted by</p>
              <p className="mt-2 font-semibold text-[#191c1c]">{record.deletedBy.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {record.deletedBy.role ? (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rolePillClass(
                      record.deletedBy.role
                    )}`}
                  >
                    {actorRoleLabel(record.deletedBy.role)}
                  </span>
                ) : null}
                {record.deletedBy.email ? (
                  <a
                    href={`mailto:${record.deletedBy.email}`}
                    className="text-sm text-[#006c49] hover:underline"
                  >
                    {record.deletedBy.email}
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No delete actor was recorded for this item.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-4">
          <button
            type="button"
            onClick={() => onRestore(record)}
            disabled={restoring}
            className={`${superPrimaryButtonClass} gap-2`}
          >
            <RotateCcw size={15} />
            {restoring ? 'Restoring...' : 'Restore record'}
          </button>
          <Link
            to="/permanent-delete"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <Trash2 size={15} />
            Permanent Delete
          </Link>
        </div>
      </aside>
    </div>
  );
}

function DetailField({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-sm text-[#191c1c] ${mono ? 'font-mono text-xs break-all' : ''}`}
      >
        {value || '—'}
      </p>
    </div>
  );
}
