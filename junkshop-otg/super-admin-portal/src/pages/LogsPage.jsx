import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Loader2, Search, Trash2, X } from 'lucide-react';
import { superAdminApi } from '../services/api';
import { downloadSheet } from '../utils/exportSheet';
import {
  formatActionLabel,
  formatCurrency,
  formatDate,
  formatShortDate,
  rolePillClass,
  statusPillClass,
} from '../utils/format';
import {
  superCardClass,
  superFilterPillClass,
  superPageTitleClass,
  superPrimaryButtonClass,
  superSecondaryButtonClass,
} from '../utils/superAdminUi';

const PAGE_SIZE = 10;

const tabs = [
  { id: 'audit', label: 'Audit Trail' },
  { id: 'transactions', label: 'Transactions' },
];

const auditActionFilters = [
  { id: '', label: 'All actions' },
  { id: 'soft_delete', label: 'Soft delete' },
  { id: 'restore', label: 'Restore' },
  { id: 'status_update', label: 'Status update' },
  { id: 'hard_delete', label: 'Hard delete' },
  { id: 'hard_reset', label: 'Hard reset' },
  { id: 'data_export', label: 'Data export' },
];

const auditRoleFilters = [
  { id: '', label: 'All roles' },
  { id: 'admin', label: 'Admin' },
  { id: 'super_admin', label: 'Super Admin' },
  { id: 'system', label: 'System' },
];

const transactionStatusFilters = [
  { id: '', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'processing', label: 'Processing' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'deleted', label: 'Deleted' },
];

function shortId(id) {
  if (!id) return '—';
  return String(id).slice(-8).toUpperCase();
}

function actorRoleLabel(role) {
  if (!role) return 'System';
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return role;
}

function transactionStatus(tx) {
  if (tx.deletedAt) return 'deleted';
  return tx.status || 'completed';
}

function matchesAuditSearch(log, query) {
  if (!query) return true;
  const haystack = [
    log.action,
    log.targetType,
    log.targetId,
    log.actor?.name,
    log.actor?.email,
    log.actor?.role,
    JSON.stringify(log.details || {}),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function matchesTransactionSearch(tx, query) {
  if (!query) return true;
  const haystack = [
    tx.id,
    tx.material,
    tx.customer?.name,
    tx.customer?.email,
    tx.provider?.name,
    tx.provider?.email,
    transactionStatus(tx),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function formatDetails(details) {
  const entries = Object.entries(details || {});
  if (entries.length === 0) return null;
  return entries.map(([key, value]) => ({
    key: key.replace(/_/g, ' '),
    value: typeof value === 'object' ? JSON.stringify(value) : String(value),
  }));
}

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState('audit');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditTargetFilter, setAuditTargetFilter] = useState('');
  const [auditRoleFilter, setAuditRoleFilter] = useState('');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([superAdminApi.listAuditLogs(), superAdminApi.listTransactions()])
      .then(([auditData, transactionData]) => {
        if (cancelled) return;
        setAuditLogs(auditData.logs || []);
        setTransactions(transactionData.transactions || []);
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

  const auditTargetOptions = useMemo(() => {
    const types = [...new Set(auditLogs.map((log) => log.targetType).filter(Boolean))].sort();
    return [{ id: '', label: 'All targets' }, ...types.map((type) => ({ id: type, label: type }))];
  }, [auditLogs]);

  useEffect(() => {
    setPage(1);
    setSelectedAudit(null);
    setSelectedTransaction(null);
  }, [activeTab, search, auditActionFilter, auditTargetFilter, auditRoleFilter, transactionStatusFilter]);

  const filteredAudit = useMemo(() => {
    const query = search.trim().toLowerCase();
    return auditLogs.filter((log) => {
      if (auditActionFilter && log.action !== auditActionFilter) return false;
      if (auditTargetFilter && log.targetType !== auditTargetFilter) return false;
      if (auditRoleFilter) {
        const role = log.actor?.role || '';
        if (auditRoleFilter === 'system') {
          if (role) return false;
        } else if (role !== auditRoleFilter) {
          return false;
        }
      }
      return matchesAuditSearch(log, query);
    });
  }, [auditLogs, search, auditActionFilter, auditTargetFilter, auditRoleFilter]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const status = transactionStatus(tx);
      if (transactionStatusFilter && status !== transactionStatusFilter) return false;
      return matchesTransactionSearch(tx, query);
    });
  }, [transactions, search, transactionStatusFilter]);

  const activeRows = activeTab === 'audit' ? filteredAudit : filteredTransactions;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const pageRows =
    activeTab === 'audit'
      ? filteredAudit.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      : filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    if (activeTab === 'audit') {
      downloadSheet(
        'audit-logs',
        ['Timestamp', 'Action', 'Target Type', 'Target ID', 'Actor', 'Actor Role', 'Actor Email', 'Details'],
        filteredAudit.map((log) => [
          formatDate(log.createdAt),
          log.action,
          log.targetType,
          log.targetId,
          log.actor?.name || 'System',
          log.actor?.role || '',
          log.actor?.email || '',
          JSON.stringify(log.details || {}),
        ])
      );
      return;
    }

    downloadSheet(
      'transaction-logs',
      [
        'Date',
        'Transaction ID',
        'Customer',
        'Customer Email',
        'Provider',
        'Provider Email',
        'Material',
        'Weight',
        'Unit',
        'Price Per Unit',
        'Total Amount',
        'Status',
      ],
      filteredTransactions.map((tx) => [
        formatDate(tx.createdAt),
        tx.id,
        tx.customer?.name || '',
        tx.customer?.email || '',
        tx.provider?.name || '',
        tx.provider?.email || '',
        tx.material,
        tx.weight,
        tx.unit,
        tx.pricePerUnit,
        tx.totalAmount,
        transactionStatus(tx),
      ])
    );
  };

  const deleteTransaction = async (transactionId) => {
    const confirmed = window.confirm(
      'Move this transaction to Deleted Records? You can restore it later.'
    );
    if (!confirmed) return;

    setDeletingId(transactionId);
    setError('');
    try {
      await superAdminApi.deleteTransaction(transactionId);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === transactionId
            ? { ...tx, status: 'deleted', deletedAt: new Date().toISOString() }
            : tx
        )
      );
      setSelectedTransaction((prev) =>
        prev?.id === transactionId
          ? { ...prev, status: 'deleted', deletedAt: new Date().toISOString() }
          : prev
      );
    } catch (err) {
      setError(err.message || 'Could not delete transaction.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={superPageTitleClass}>Logs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Full audit trail and platform transaction history.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={activeRows.length === 0}
          className={`${superPrimaryButtonClass} gap-2`}
        >
          <Download size={16} />
          Download Sheet
        </button>
      </div>

      <div className={`${superCardClass} p-1.5`}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={superFilterPillClass(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${superCardClass} flex flex-col gap-4 p-4`}>
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'audit'
                ? 'Search action, target, actor, details...'
                : 'Search customer, provider, material...'
            }
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
          />
        </div>

        {activeTab === 'audit' ? (
          <div className="flex flex-wrap gap-2">
            {auditActionFilters.map((item) => (
              <button
                key={item.id || 'all-actions'}
                type="button"
                onClick={() => setAuditActionFilter(item.id)}
                className={superFilterPillClass(auditActionFilter === item.id)}
              >
                {item.label}
              </button>
            ))}
            <select
              value={auditTargetFilter}
              onChange={(e) => setAuditTargetFilter(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
            >
              {auditTargetOptions.map((item) => (
                <option key={item.id || 'all-targets'} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={auditRoleFilter}
              onChange={(e) => setAuditRoleFilter(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
            >
              {auditRoleFilters.map((item) => (
                <option key={item.id || 'all-roles'} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {transactionStatusFilters.map((item) => (
              <button
                key={item.id || 'all-status'}
                type="button"
                onClick={() => setTransactionStatusFilter(item.id)}
                className={superFilterPillClass(transactionStatusFilter === item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading logs...
        </div>
      ) : activeRows.length === 0 ? (
        <div className={`${superCardClass} px-4 py-16 text-center text-zinc-500`}>
          {search || auditActionFilter || auditTargetFilter || auditRoleFilter || transactionStatusFilter
            ? 'No logs match your filters.'
            : 'No logs found yet.'}
        </div>
      ) : (
        <div className={`${superCardClass} overflow-hidden`}>
          <div className="scroll-x-clean">
            {activeTab === 'audit' ? (
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Target</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pageRows.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-zinc-50/80">
                      <td className="px-6 py-3 text-zinc-600">{formatShortDate(log.createdAt)}</td>
                      <td className="px-6 py-3 font-medium text-[#191c1c]">
                        {formatActionLabel(log.action)}
                      </td>
                      <td className="px-6 py-3">
                        <span className="capitalize text-[#191c1c]">{log.targetType}</span>
                        <span className="mt-0.5 block font-mono text-xs text-zinc-400">
                          {shortId(log.targetId)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-medium text-[#191c1c]">
                          {log.actor?.name || 'System'}
                        </span>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rolePillClass(
                            log.actor?.role || 'system'
                          )}`}
                        >
                          {actorRoleLabel(log.actor?.role)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedAudit(log)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006c49] transition-colors hover:text-[#005236] hover:underline"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Provider</th>
                    <th className="px-6 py-4">Material</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pageRows.map((tx) => {
                    const status = transactionStatus(tx);
                    return (
                      <tr key={tx.id} className="transition-colors hover:bg-zinc-50/80">
                        <td className="px-6 py-3 text-zinc-600">{formatShortDate(tx.createdAt)}</td>
                        <td className="px-6 py-3">{tx.customer?.name || 'Unknown'}</td>
                        <td className="px-6 py-3">{tx.provider?.name || 'Unknown'}</td>
                        <td className="px-6 py-3">
                          <span className="font-medium text-[#191c1c]">{tx.material}</span>
                          <span className="mt-0.5 block text-xs text-zinc-500">
                            {tx.weight} {tx.unit}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-semibold">{formatCurrency(tx.totalAmount)}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedTransaction(tx)}
                              className="text-sm font-semibold text-[#006c49] transition-colors hover:text-[#005236] hover:underline"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTransaction(tx.id)}
                              disabled={Boolean(tx.deletedAt) || deletingId === tx.id}
                              className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              {deletingId === tx.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-6 py-3 text-sm text-zinc-500">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, activeRows.length)} of{' '}
              {activeRows.length} results
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

      {selectedAudit && (
        <AuditLogDrawer log={selectedAudit} onClose={() => setSelectedAudit(null)} />
      )}

      {selectedTransaction && (
        <TransactionDrawer
          transaction={selectedTransaction}
          deleting={deletingId === selectedTransaction.id}
          onClose={() => setSelectedTransaction(null)}
          onDelete={deleteTransaction}
        />
      )}
    </div>
  );
}

function AuditLogDrawer({ log, onClose }) {
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

  const details = formatDetails(log.details);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#006c49]">Audit log</p>
            <h2 className="text-lg font-bold text-[#191c1c]">{formatActionLabel(log.action)}</h2>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Timestamp" value={formatDate(log.createdAt)} />
            <DetailField label="Action" value={formatActionLabel(log.action)} />
            <DetailField label="Target type" value={log.targetType} capitalize />
            <DetailField label="Target ID" value={log.targetId} mono />
          </div>

          <div className="rounded-lg border border-zinc-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Actor</p>
            <p className="mt-2 font-semibold text-[#191c1c]">{log.actor?.name || 'System'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rolePillClass(
                  log.actor?.role || 'system'
                )}`}
              >
                {actorRoleLabel(log.actor?.role)}
              </span>
              {log.actor?.email ? (
                <a href={`mailto:${log.actor.email}`} className="text-sm text-[#006c49] hover:underline">
                  {log.actor.email}
                </a>
              ) : null}
            </div>
          </div>

          {details ? (
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Details</p>
              <dl className="mt-3 space-y-3">
                {details.map((item) => (
                  <div key={item.key}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 capitalize">
                      {item.key}
                    </dt>
                    <dd className="mt-1 break-all text-sm text-zinc-700">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No additional details recorded.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function TransactionDrawer({ transaction, onClose, onDelete, deleting }) {
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

  const status = transactionStatus(transaction);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#006c49]">Transaction</p>
            <h2 className="text-lg font-bold text-[#191c1c]">{transaction.material}</h2>
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
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                status
              )}`}
            >
              {status}
            </span>
            <span className="font-mono text-xs text-zinc-400">{shortId(transaction.id)}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Date" value={formatDate(transaction.createdAt)} />
            <DetailField label="Total amount" value={formatCurrency(transaction.totalAmount)} />
            <DetailField label="Weight" value={`${transaction.weight} ${transaction.unit}`} />
            <DetailField label="Price per unit" value={formatCurrency(transaction.pricePerUnit)} />
          </div>

          <PartyCard title="Customer" party={transaction.customer} />
          <PartyCard title="Provider" party={transaction.provider} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-4">
          <button type="button" onClick={onClose} className={superSecondaryButtonClass}>
            Close
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            disabled={Boolean(transaction.deletedAt) || deleting}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function DetailField({ label, value, capitalize = false, mono = false }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-sm text-[#191c1c] ${capitalize ? 'capitalize' : ''} ${
          mono ? 'font-mono text-xs break-all' : ''
        }`}
      >
        {value || '—'}
      </p>
    </div>
  );
}

function PartyCard({ title, party }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-2 font-semibold text-[#191c1c]">{party?.name || 'Unknown'}</p>
      {party?.email ? (
        <a href={`mailto:${party.email}`} className="mt-1 block text-sm text-[#006c49] hover:underline">
          {party.email}
        </a>
      ) : null}
      {party?.phone ? <p className="mt-1 text-sm text-zinc-600">{party.phone}</p> : null}
      {party?.status ? (
        <span
          className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
            party.status
          )}`}
        >
          {party.status}
        </span>
      ) : null}
    </div>
  );
}
