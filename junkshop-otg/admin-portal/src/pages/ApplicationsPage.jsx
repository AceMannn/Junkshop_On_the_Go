import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import { formatDate, statusPillClass } from '../utils/format';
import {
  adminCardClass,
  adminFilterPillClass,
  adminPageTitleClass,
  adminSecondaryButtonClass,
} from '../utils/adminUi';

const filters = [
  { id: 'pending', label: 'Pending' },
  { id: '', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'draft', label: 'Draft' },
];

export default function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('status') || 'pending';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .listApplications(filter || undefined)
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
  }, [filter]);

  const setFilter = (status) => {
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={adminPageTitleClass}>Provider applications</h1>
          <p className="mt-1 text-sm text-[#5c6658]">
            Review junkshop verification submissions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id || 'all'}
              type="button"
              onClick={() => setFilter(item.id)}
              className={adminFilterPillClass(filter === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading applications...
        </div>
      ) : applications.length === 0 ? (
        <div className={`${adminCardClass} px-4 py-16 text-center text-zinc-500`}>
          No applications found.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {applications.map((row) => (
              <article key={row.id} className={`${adminCardClass} p-4 space-y-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{row.junkshopName}</p>
                    <p className="text-sm text-zinc-500">{row.ownerName}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusPillClass(
                      row.verificationStatus
                    )}`}
                  >
                    {row.verificationStatus}
                  </span>
                </div>
                <p className="text-sm text-zinc-600">{row.phone || '—'}</p>
                <p className="text-xs text-zinc-500">
                  Submitted {formatDate(row.verificationSubmittedAt)}
                </p>
                <Link to={`/applications/${row.id}`} className={`${adminSecondaryButtonClass} w-full`}>
                  Review application
                </Link>
              </article>
            ))}
          </div>

          <div className={`${adminCardClass} hidden md:block overflow-hidden`}>
            <div className="scroll-x-clean">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Junkshop</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {applications.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-100 hover:bg-zinc-50/80">
                      <td className="px-4 py-3 font-medium">{row.junkshopName}</td>
                      <td className="px-4 py-3">{row.ownerName}</td>
                      <td className="px-4 py-3">{row.phone}</td>
                      <td className="px-4 py-3 capitalize">{row.verificationStatus}</td>
                      <td className="px-4 py-3">{formatDate(row.verificationSubmittedAt)}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/applications/${row.id}`}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold hover:bg-white"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
