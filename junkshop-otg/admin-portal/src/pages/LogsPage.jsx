import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { adminCardClass, adminPageTitleClass } from '../utils/adminUi';

export default function LogsPage() {
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([adminApi.listTransactions(), adminApi.listAuditLogs()])
      .then(([transactionData, auditData]) => {
        if (cancelled) return;
        setTransactions(transactionData.transactions || []);
        setAuditLogs(auditData.logs || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load logs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Transaction & Audit Logs</h1>
        <p className="mt-1 text-sm text-[#5c6658]">
          Read-only financial history and moderation activity. Deletions are Super Admin only.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading logs...
        </div>
      ) : (
        <>
          <section className={`${adminCardClass} overflow-hidden`}>
            <div className="border-b border-zinc-100 px-4 py-3">
              <h2 className="font-bold text-[#191c1c]">Transaction Logs</h2>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {transactions.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">No transactions found.</p>
              ) : (
                transactions.map((tx) => (
                  <article key={tx.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#191c1c]">{tx.material}</p>
                        <p className="text-xs text-zinc-500">{formatDate(tx.createdAt)}</p>
                      </div>
                      <p className="shrink-0 font-bold text-emerald-800">{formatCurrency(tx.totalAmount)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Customer</p>
                        <p className="truncate">{tx.customer?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Provider</p>
                        <p className="truncate">{tx.provider?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    <p className="text-xs capitalize text-zinc-600">
                      Status: {tx.deletedAt ? 'deleted' : tx.status}
                    </p>
                  </article>
                ))
              )}
            </div>
            <div className="scroll-x-clean hidden md:block">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-4 py-3">{formatDate(tx.createdAt)}</td>
                        <td className="px-4 py-3">{tx.customer?.name || 'Unknown'}</td>
                        <td className="px-4 py-3">{tx.provider?.name || 'Unknown'}</td>
                        <td className="px-4 py-3">{tx.material}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(tx.totalAmount)}</td>
                        <td className="px-4 py-3 capitalize">{tx.deletedAt ? 'deleted' : tx.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${adminCardClass} overflow-hidden`}>
            <div className="border-b border-zinc-100 px-4 py-3">
              <h2 className="font-bold text-[#191c1c]">Audit Trail</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {auditLogs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No audit logs yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="px-4 py-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold capitalize text-[#191c1c]">
                        {log.action.replace(/_/g, ' ')} {log.targetType}
                      </p>
                      <p className="text-xs text-zinc-500">{formatDate(log.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      By {log.actor?.name || 'System'} {log.actor?.role ? `(${log.actor.role})` : ''}
                    </p>
                    {Object.keys(log.details || {}).length > 0 && (
                      <p className="mt-1 break-all text-xs text-zinc-500">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
