import { useEffect, useMemo, useState } from 'react';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import { adminApi } from '../services/api';
import { formatDate } from '../utils/format';
import {
  adminCardClass,
  adminInputClass,
  adminPageTitleClass,
  adminSecondaryButtonClass,
  adminSelectClass,
} from '../utils/adminUi';

function typeLabel(type) {
  return String(type || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DeletedRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoringId, setRestoringId] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.listDeletedRecords();
      setRecords(data.records || []);
    } catch (err) {
      setError(err.message || 'Could not load deleted records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const restore = async (record) => {
    const confirmed = window.confirm(`Restore "${record.label}" back to the system?`);
    if (!confirmed) return;

    setRestoringId(`${record.type}:${record.id}`);
    setError('');
    try {
      await adminApi.restoreDeletedRecord(record.type, record.id);
      setRecords((prev) => prev.filter((item) => item.id !== record.id || item.type !== record.type));
    } catch (err) {
      setError(err.message || 'Could not restore record.');
    } finally {
      setRestoringId('');
    }
  };

  const recordTypes = useMemo(
    () => ['all', ...new Set(records.map((record) => record.type).filter(Boolean))],
    [records]
  );

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      const matchesType = typeFilter === 'all' || record.type === typeFilter;
      const haystack = [
        record.type,
        record.label,
        record.status,
        record.deletedAt,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesType && (!search || haystack.includes(search));
    });
  }, [records, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Deleted Records</h1>
        <p className="mt-1 text-sm text-[#5c6658]">
          Soft-deleted records stay in the database and can be restored here.
        </p>
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
                {type === 'all' ? `All records (${records.length})` : `${typeLabel(type)} (${records.filter((record) => record.type === type).length})`}
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
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const restoreKey = `${record.type}:${record.id}`;
            return (
              <div
                key={restoreKey}
                className={`${adminCardClass} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
                      {typeLabel(record.type)}
                    </span>
                    {record.status && (
                      <span className="text-xs font-semibold capitalize text-zinc-500">
                        {record.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-semibold text-[#191c1c]">{record.label}</p>
                  <p className="text-xs text-zinc-500">
                    Deleted {formatDate(record.deletedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => restore(record)}
                  disabled={restoringId === restoreKey}
                  className={adminSecondaryButtonClass}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {restoringId === restoreKey ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
