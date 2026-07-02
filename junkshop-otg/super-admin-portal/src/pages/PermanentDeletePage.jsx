import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye, Loader2, Search, Trash2, X } from 'lucide-react';
import { superAdminApi } from '../services/api';
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
  superInputClass,
  superPageTitleClass,
  superSecondaryButtonClass,
} from '../utils/superAdminUi';

const PAGE_SIZE = 10;
const CONFIRM_TEXT = 'DELETE';

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
  if (!query) return true;
  const haystack = [
    record.type,
    record.label,
    record.status,
    record.id,
    record.deletedBy?.name,
    record.deletedBy?.email,
    record.deletedBy?.role,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function PermanentDeletePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  const removeRecord = (recordId, recordType) => {
    setRecords((prev) => prev.filter((item) => item.id !== recordId || item.type !== recordType));
    setSelectedRecord((prev) =>
      prev?.id === recordId && prev?.type === recordType ? null : prev
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={superPageTitleClass}>Permanent Delete</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Irreversibly remove soft-deleted records from the database.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div>
          <p className="font-semibold">Danger zone — this cannot be undone</p>
          <p className="mt-1">
            Permanent delete removes records completely. Restore from{' '}
            <Link to="/deleted-records" className="font-semibold underline-offset-2 hover:underline">
              Deleted Records
            </Link>{' '}
            if you only meant to hide an item temporarily.
          </p>
        </div>
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

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading deleted records...
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${superCardClass} px-4 py-16 text-center text-zinc-500`}>
          {search || typeFilter
            ? 'No deleted records match your filters.'
            : 'No soft-deleted records are waiting for permanent removal.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div className={`${superCardClass} overflow-hidden`}>
            <div className="scroll-x-clean">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Label</th>
                    <th className="px-5 py-4">Deleted</th>
                    <th className="px-5 py-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pageRows.map((record) => {
                    const key = `${record.type}:${record.id}`;
                    const active =
                      selectedRecord?.id === record.id && selectedRecord?.type === record.type;
                    return (
                      <tr
                        key={key}
                        className={`transition-colors hover:bg-zinc-50/80 ${active ? 'bg-red-50/50' : ''}`}
                      >
                        <td className="px-5 py-3">
                          <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
                            {typeLabel(record.type)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-medium text-[#191c1c]">{record.label}</span>
                          <span className="mt-0.5 block font-mono text-xs text-zinc-400">
                            {shortId(record.id)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-600">{formatShortDate(record.deletedAt)}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(record)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 transition-colors hover:underline"
                          >
                            <Eye size={15} />
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-5 py-3 text-sm text-zinc-500">
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

          <div className={`${superCardClass} hidden min-h-[28rem] lg:block`}>
            {selectedRecord ? (
              <PermanentDeletePanel
                record={selectedRecord}
                onDeleted={removeRecord}
                onError={setError}
              />
            ) : (
              <div className="flex h-full min-h-[28rem] flex-col items-center justify-center px-6 text-center text-zinc-500">
                <Trash2 size={32} className="mb-3 text-zinc-300" />
                <p className="text-sm">Select a record to review permanent deletion</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedRecord ? (
        <div className="lg:hidden">
          <PermanentDeleteDrawer
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onDeleted={removeRecord}
            onError={setError}
          />
        </div>
      ) : null}
    </div>
  );
}

function PermanentDeletePanel({ record, onDeleted, onError }) {
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setConfirmation('');
    setLocalError('');
  }, [record]);

  const canDelete = confirmation.trim() === CONFIRM_TEXT;

  const handleDelete = async () => {
    if (!canDelete) return;

    setDeleting(true);
    setLocalError('');
    onError('');
    try {
      await superAdminApi.permanentlyDeleteRecord(record.type, record.id, confirmation.trim());
      onDeleted(record.id, record.type);
    } catch (err) {
      const message = err.message || 'Could not permanently delete record.';
      setLocalError(message);
      onError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-h-[28rem] flex-col">
      <div className="border-b border-zinc-100 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-red-700">Permanent delete</p>
        <h2 className="mt-1 text-lg font-bold text-[#191c1c] break-words">{record.label}</h2>
      </div>

      <div className="scroll-y-clean flex-1 space-y-4 overflow-y-auto p-5">
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
          <DetailField label="Deleted at" value={formatDate(record.deletedAt)} />
          <DetailField label="Deleted by" value={deletedByLabel(record)} />
          <DetailField label="Created" value={formatDate(record.createdAt)} />
        </div>

        {record.deletedBy?.role ? (
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rolePillClass(
              record.deletedBy.role
            )}`}
          >
            {actorRoleLabel(record.deletedBy.role)}
          </span>
        ) : null}

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">Confirm permanent deletion</p>
          <p className="mt-1 text-xs text-red-800">
            Type <span className="font-mono font-bold">{CONFIRM_TEXT}</span> below to remove this
            record forever.
          </p>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={CONFIRM_TEXT}
            className={`${superInputClass} mt-3 border-red-200 focus:border-red-500 focus:ring-red-500/20`}
            autoComplete="off"
          />
        </div>

        {localError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {localError}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || deleting}
          className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleting ? 'Deleting...' : 'Permanently delete'}
        </button>
        <Link to="/deleted-records" className={superSecondaryButtonClass}>
          Back to Deleted Records
        </Link>
      </div>
    </div>
  );
}

function PermanentDeleteDrawer({ record, onClose, onDeleted, onError }) {
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
        <div className="flex items-center justify-end border-b border-zinc-200 px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <PermanentDeletePanel
          record={record}
          onDeleted={(id, type) => {
            onDeleted(id, type);
            onClose();
          }}
          onError={onError}
        />
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
