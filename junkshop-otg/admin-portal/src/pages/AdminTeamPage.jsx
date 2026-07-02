import { useEffect, useState } from 'react';
import { Loader2, UserCog } from 'lucide-react';
import { adminApi } from '../services/api';
import { formatDate, statusPillClass } from '../utils/format';
import { adminCardClass, adminPageTitleClass } from '../utils/adminUi';

export default function AdminTeamPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .listAdminTeam()
      .then((data) => {
        if (!cancelled) setAdmins(data.admins || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load admin team.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = admins.filter((row) => row.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Admin Team</h1>
        <p className="mt-1 text-sm text-[#5c6658]">
          Read-only list of platform admin accounts. Account changes are handled by Super Admin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${adminCardClass} p-4`}>
          <p className="text-sm text-zinc-500">Active admins</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1c]">{activeCount}</p>
        </div>
        <div className={`${adminCardClass} p-4`}>
          <p className="text-sm text-zinc-500">Total admin accounts</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1c]">{admins.length}</p>
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
          Loading admin team...
        </div>
      ) : admins.length === 0 ? (
        <div className={`${adminCardClass} px-4 py-16 text-center text-zinc-500`}>
          <UserCog className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          No admin accounts found.
        </div>
      ) : (
        <div className={`${adminCardClass} overflow-hidden`}>
          <div className="scroll-x-clean">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {admins.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/80">
                    <td className="px-4 py-3 font-medium text-[#191c1c]">{row.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
