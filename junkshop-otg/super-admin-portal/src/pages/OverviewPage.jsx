import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader2, Mail, Settings, UserCog, Users } from 'lucide-react';
import { superAdminApi } from '../services/api';
import { superCardClass, superPageTitleClass } from '../utils/superAdminUi';

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([superAdminApi.getOverview(), superAdminApi.getSystemSettings()])
      .then(([overviewData, settingsData]) => {
        if (cancelled) return;
        setStats(overviewData.stats);
        setSystemSettings(settingsData.settings || null);
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

  const operationCards = useMemo(
    () => [
      {
        label: 'Pending Applications',
        value: stats?.pendingApplications ?? 0,
        hint: 'Awaiting review',
        icon: ClipboardList,
      },
      {
        label: 'Approved Providers',
        value: stats?.approvedApplications ?? 0,
        hint: 'Verified junkshops',
        icon: Users,
      },
      {
        label: 'Unread Contact',
        value: stats?.unreadContactMessages ?? 0,
        hint: 'New inbox items',
        icon: Mail,
      },
      {
        label: 'Total Users',
        value: stats?.totalUsers ?? 0,
        hint: 'Customers + providers',
        icon: Users,
      },
    ],
    [stats]
  );

  const governanceCards = useMemo(
    () => [
      { label: 'Active Admins', value: stats?.activeAdmins ?? 0, hint: 'Regular admin accounts' },
      {
        label: 'System Status',
        value: systemSettings?.maintenanceMode ? 'Maintenance' : 'Online',
        hint: systemSettings?.maintenanceMode
          ? 'Public app access limited'
          : 'All services available',
      },
      { label: 'Recent Admin Actions', value: '—', hint: 'Full audit logs (Phase 6)' },
    ],
    [stats, systemSettings]
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
    <div className="space-y-8">
      <div>
        <h1 className={superPageTitleClass}>Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">Welcome back, Super Admin</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {operationCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${superCardClass} p-5`}>
              <div className="mb-3 flex items-start justify-between">
                <p className="text-sm text-zinc-500">{card.label}</p>
                <Icon size={18} className="text-[#006c49]" />
              </div>
              <p className="text-3xl font-bold text-[#191c1c]">{card.value}</p>
              <p className="mt-1 text-xs text-zinc-400">{card.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {governanceCards.map((card) => (
          <div key={card.label} className={`${superCardClass} p-5`}>
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#191c1c]">{card.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{card.hint}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#191c1c]">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/applications"
            className="inline-flex items-center gap-2 rounded-lg bg-[#006c49] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#005236] active:scale-[0.98]"
          >
            <ClipboardList size={16} />
            Applications
          </Link>
          <Link
            to="/admin-management"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#191c1c] transition-colors hover:bg-zinc-50 active:scale-[0.98]"
          >
            <UserCog size={16} />
            Admin Management
          </Link>
          <Link
            to="/system-settings"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#191c1c] transition-colors hover:bg-zinc-50 active:scale-[0.98]"
          >
            <Settings size={16} />
            System Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
