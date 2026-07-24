import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Search } from 'lucide-react';
import { adminApi } from '../services/api';
import { formatDate, statusPillClass } from '../utils/format';
import {
  adminCardClass,
  adminInputClass,
  adminPageTitleClass,
  adminSelectClass,
} from '../utils/adminUi';
import { matchesPrefixWordSearch } from '../utils/searchFilter';

function typeLabel(type) {
  return String(type || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function deletedByLabel(record) {
  if (!record.deletedBy?.name) return 'Unknown';
  const role = record.deletedBy.role ? ` (${record.deletedBy.role.replace('_', ' ')})` : '';
  return `${record.deletedBy.name}${role}`;
}

export default function DeletedRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
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

  const recordTypes = useMemo(
    () => ['all', ...new Set(records.map((record) => record.type).filter(Boolean))],
    [records]
  );

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      const matchesType = typeFilter === 'all' || record.type === typeFilter;
      return (
        matchesType &&
        matchesPrefixWordSearch(
          [
            record.type,
            record.label,
            record.status,
            record.deletedAt,
            record.deletedBy?.name,
            record.deletedBy?.email,
          ],
          search
        )
      );
    });
  }, [records, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Deleted Records</h1>
        <p className="mt-1 text-sm text-[#5c6658]">
          View-only history of soft-deleted items. Restore and permanent delete are Super Admin only.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You can browse who deleted what and when. Contact Super Admin if a record needs to be restored.
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className={`${adminCardClass} p-4`}>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search deleted records..."
              className={`${adminInputClass} pl-9`}
            />
          </label>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className={adminSelectClass}
          >
            {recordTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all'
                  ? `All records (${records.length})`
                  : `${typeLabel(type)} (${records.filter((record) => record.type === type).length})`}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading deleted records...
        </div>
      ) : records.length === 0 ? (
        <div className={`${adminCardClass} px-4 py-16 text-center text-zinc-500`}>
          No deleted records found.
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className={`${adminCardClass} px-4 py-16 text-center text-zinc-500`}>
          No deleted records match your filters.
        </div>
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          {filteredRecords.map((record) => {
            const key = `${record.type}:${record.id}`;
            return (
              <article key={key} className={`${adminCardClass} p-4 space-y-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
                      {typeLabel(record.type)}
                    </span>
                    <p className="mt-2 font-semibold text-[#191c1c]">{record.label}</p>
                    {record.status ? (
                      <span
                        className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusPillClass(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Deleted</p>
                    <p>{formatDate(record.deletedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Deleted by</p>
                    <p className="truncate">{deletedByLabel(record)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(record)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
                >
                  <Eye size={15} />
                  View details
                </button>
              </article>
            );
          })}
        </div>
        <div className={`${adminCardClass} hidden md:block overflow-hidden`}>
          <div className="scroll-x-clean">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Deleted</th>
                  <th className="px-4 py-3">Deleted by</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRecords.map((record) => {
                  const key = `${record.type}:${record.id}`;
                  return (
                    <tr key={key} className="hover:bg-zinc-50/80">
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
                          {typeLabel(record.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#191c1c]">{record.label}</p>
                        {record.status ? (
                          <span
                            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusPillClass(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{formatDate(record.deletedAt)}</td>
                      <td className="px-4 py-3 text-zinc-600">{deletedByLabel(record)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {selectedRecord ? (
        <div className={`${adminCardClass} p-5 space-y-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Deleted record</p>
              <h2 className="mt-1 text-lg font-bold text-[#191c1c]">{selectedRecord.label}</h2>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-700"
            >
              Close
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Type</p>
              <p className="mt-1 font-medium capitalize">{typeLabel(selectedRecord.type)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Record ID</p>
              <p className="mt-1 font-mono text-xs break-all">{selectedRecord.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Deleted at</p>
              <p className="mt-1">{formatDate(selectedRecord.deletedAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Deleted by</p>
              <p className="mt-1">{deletedByLabel(selectedRecord)}</p>
              {selectedRecord.deletedBy?.email ? (
                <p className="text-xs text-zinc-500">{selectedRecord.deletedBy.email}</p>
              ) : null}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Created</p>
              <p className="mt-1">{formatDate(selectedRecord.createdAt)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
