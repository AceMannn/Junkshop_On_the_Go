import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import ApplicationReviewDrawer from '../components/ApplicationReviewDrawer';
import { superAdminApi } from '../services/api';
import { downloadSheet } from '../utils/exportSheet';
import { formatShortDate, shortAppId, statusPillClass } from '../utils/format';
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
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'draft', label: 'Draft' },
];

function matchesSearch(row, query) {
  return matchesPrefixWordSearch(
    [row.ownerName, row.junkshopName, row.email, row.phone, row.id],
    query
  );
}

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    superAdminApi
      .listApplications(statusFilter || undefined)
      .then((data) => {
        if (!cancelled) setApplications(data.applications || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load applications.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const reloadApplications = () => {
    setLoading(true);
    setError('');
    return superAdminApi
      .listApplications(statusFilter || undefined)
      .then((data) => setApplications(data.applications || []))
      .catch((err) => setError(err.message || 'Could not load applications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter((row) => matchesSearch(row, query));
  }, [applications, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    downloadSheet(
      `applications-${statusFilter || 'all'}`,
      ['App ID', 'Owner Name', 'Junkshop Name', 'Email', 'Phone', 'Status', 'Submitted Date'],
      filtered.map((row) => [
        shortAppId(row.id),
        row.ownerName,
        row.junkshopName,
        row.email,
        row.phone,
        row.verificationStatus,
        formatShortDate(row.verificationSubmittedAt),
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={superPageTitleClass}>Applications Management</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review and manage junkshop registration applications.
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

      <div className={`${superCardClass} flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between`}>
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owner, junkshop, email..."
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
          Loading applications...
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${superCardClass} px-4 py-16 text-center text-zinc-500`}>
          {search ? 'No applications match your search.' : 'No applications found.'}
        </div>
      ) : (
        <div className={`${superCardClass} overflow-hidden`}>
          <div className="scroll-x-clean">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-6 py-4">App ID</th>
                  <th className="px-6 py-4">Owner Name</th>
                  <th className="px-6 py-4">Junkshop Name</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pageRows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-zinc-50/80"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-zinc-500">{shortAppId(row.id)}</td>
                    <td className="px-6 py-3 font-medium text-[#191c1c]">{row.ownerName}</td>
                    <td className="px-6 py-3">{row.junkshopName}</td>
                    <td className="px-6 py-3 text-zinc-600">
                      {formatShortDate(row.verificationSubmittedAt)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                          row.verificationStatus
                        )}`}
                      >
                        {row.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className="text-sm font-semibold text-[#006c49] transition-colors hover:text-[#005236] hover:underline"
                      >
                        {row.verificationStatus === 'pending' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-6 py-3 text-sm text-zinc-500">
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
      )}

      {selectedId && (
        <ApplicationReviewDrawer
          applicationId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={reloadApplications}
        />
      )}
    </div>
  );
}
