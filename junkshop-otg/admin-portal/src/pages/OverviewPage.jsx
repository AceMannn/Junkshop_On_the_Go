import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import { adminCardClass, adminPageTitleClass } from '../utils/adminUi';

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getOverview()
      .then((data) => {
        if (!cancelled) setStats(data.stats);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load overview.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(
    () => [
      { label: 'Pending applications', value: stats?.pendingApplications ?? 0, hint: 'Awaiting review' },
      { label: 'Approved providers', value: stats?.approvedApplications ?? 0, hint: 'Verified junkshops' },
      { label: 'Unread contact', value: stats?.unreadContactMessages ?? 0, hint: 'New inbox items' },
      { label: 'Total users', value: stats?.totalUsers ?? 0, hint: 'Customers + providers' },
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading overview...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Overview</h1>
        <p className="mt-1 text-sm text-[#5c6658]">
          Platform snapshot for verification, users, and contact queue.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`${adminCardClass} p-5`}>
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#191c1c]">{card.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{card.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
