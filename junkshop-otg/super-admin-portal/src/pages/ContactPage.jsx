import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Inbox, Loader2, Mail, Search, Send, Trash2, X } from 'lucide-react';
import { superAdminApi } from '../services/api';
import { downloadSheet } from '../utils/exportSheet';
import { formatDate, statusPillClass } from '../utils/format';
import {
  superCardClass,
  superInputClass,
  superPageTitleClass,
  superPrimaryButtonClass,
  superSecondaryButtonClass,
} from '../utils/superAdminUi';

const statusFilters = [
  { id: '', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'read', label: 'Read' },
  { id: 'resolved', label: 'Resolved' },
];

function notifyContactUpdated() {
  window.dispatchEvent(new Event('super-admin-contact-updated'));
}

function matchesSearch(row, query) {
  if (!query) return true;
  const haystack = [row.subject, row.name, row.email, row.message]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function buildReplyUrl(message) {
  const subject = encodeURIComponent(`Re: ${message.subject || 'JunkShop On-The-Go support'}`);
  const body = encodeURIComponent(
    `Hi ${message.name || 'there'},\n\n\n\n---\nOriginal message:\n${message.message || ''}`
  );
  return `mailto:${message.email}?subject=${subject}&body=${body}`;
}

export default function ContactPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    superAdminApi
      .listContactMessages()
      .then((data) => {
        if (!cancelled) setMessages(data.messages || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load contact messages.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return messages.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      return matchesSearch(row, query);
    });
  }, [messages, search, statusFilter]);

  const handleContactStatus = async (messageId, status) => {
    try {
      await superAdminApi.updateContactMessageStatus(messageId, status);
      setMessages((prev) =>
        prev.map((row) => (row._id === messageId ? { ...row, status } : row))
      );
      setSelectedMessage((prev) => (prev?._id === messageId ? { ...prev, status } : prev));
      notifyContactUpdated();
    } catch (err) {
      setError(err.message || 'Could not update message status.');
    }
  };

  const openMessage = async (row) => {
    setSelectedMessage(row);
    if (row.status !== 'new') return;

    try {
      await superAdminApi.updateContactMessageStatus(row._id, 'read');
      setMessages((prev) =>
        prev.map((item) => (item._id === row._id ? { ...item, status: 'read' } : item))
      );
      setSelectedMessage({ ...row, status: 'read' });
      notifyContactUpdated();
    } catch (err) {
      setError(err.message || 'Could not mark message as read.');
    }
  };

  useEffect(() => {
    if (loading || messages.length === 0 || selectedMessage) return;

    const messageId = searchParams.get('message');
    if (!messageId) return;

    const message = messages.find((row) => row._id === messageId);
    if (!message) return;

    openMessage(message);
    setSearchParams({}, { replace: true });
  }, [loading, messages, searchParams, selectedMessage, setSearchParams]);

  const deleteMessage = async (messageId) => {
    const confirmed = window.confirm(
      'Move this contact message to Deleted Records? You can restore it later.'
    );
    if (!confirmed) return;

    setDeletingId(messageId);
    setError('');
    try {
      await superAdminApi.deleteContactMessage(messageId);
      setMessages((prev) => prev.filter((row) => row._id !== messageId));
      setSelectedMessage((prev) => (prev?._id === messageId ? null : prev));
      notifyContactUpdated();
    } catch (err) {
      setError(err.message || 'Could not delete contact message.');
    } finally {
      setDeletingId('');
    }
  };

  const handleExport = () => {
    downloadSheet(
      'contact-messages',
      ['Subject', 'Name', 'Email', 'Status', 'Date', 'Message'],
      filtered.map((row) => [
        row.subject,
        row.name,
        row.email,
        row.status,
        formatDate(row.createdAt),
        row.message,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={superPageTitleClass}>Contact</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Public contact form submissions from the website.
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

      <div className={`${superCardClass} flex flex-col gap-4 p-4 lg:flex-row lg:items-center`}>
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sender, subject, message..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item.id || 'all'}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === item.id
                  ? 'bg-[#006c49] text-white'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
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
          Loading messages...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
          <div className={`${superCardClass} overflow-hidden`}>
            {filtered.length === 0 ? (
              <div className="px-4 py-16 text-center text-zinc-500">
                {search || statusFilter ? 'No messages match your filters.' : 'No contact messages yet.'}
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {filtered.map((row) => (
                  <li key={row._id}>
                    <button
                      type="button"
                      onClick={() => openMessage(row)}
                      className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-zinc-50 ${
                        selectedMessage?._id === row._id ? 'bg-emerald-50/60' : ''
                      } ${row.status === 'new' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Mail size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-[#191c1c]">{row.subject}</span>
                          {row.status === 'new' && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                              New
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-zinc-500">
                          {row.name} · {row.email}
                        </span>
                        <span className="mt-1 line-clamp-2 text-xs text-zinc-500">{row.message}</span>
                        <span className="mt-1 block text-[11px] text-zinc-400">
                          {formatDate(row.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${superCardClass} hidden min-h-[28rem] lg:block`}>
            {selectedMessage ? (
              <ContactDetailPanel
                message={selectedMessage}
                onStatusChange={handleContactStatus}
                onDelete={deleteMessage}
                deleting={deletingId === selectedMessage._id}
              />
            ) : (
              <div className="flex h-full min-h-[28rem] flex-col items-center justify-center px-6 text-center text-zinc-500">
                <Inbox size={32} className="mb-3 text-zinc-300" />
                <p className="text-sm">Select a message to read details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedMessage && (
        <div className="lg:hidden">
          <ContactMessageDrawer
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
            onStatusChange={handleContactStatus}
            onDelete={deleteMessage}
            deleting={deletingId === selectedMessage._id}
          />
        </div>
      )}
    </div>
  );
}

function ContactDetailPanel({ message, onStatusChange, onDelete, deleting }) {
  return (
    <div className="flex h-full min-h-[28rem] flex-col">
      <div className="border-b border-zinc-100 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#006c49]">Message details</p>
        <h2 className="mt-1 text-lg font-bold text-[#191c1c] break-words">{message.subject}</h2>
      </div>

      <div className="scroll-y-clean flex-1 space-y-4 overflow-y-auto p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Inbox size={18} />
          </span>
          <div>
            <p className="font-semibold text-[#191c1c]">{message.name}</p>
            <a href={`mailto:${message.email}`} className="text-sm text-[#006c49] hover:underline">
              {message.email}
            </a>
            <p className="mt-1 text-xs text-zinc-500">{formatDate(message.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
              message.status
            )}`}
          >
            {message.status}
          </span>
          <select
            value={message.status}
            onChange={(e) => onStatusChange(message._id, e.target.value)}
            className={`${superInputClass} w-auto capitalize`}
          >
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700">
          {message.message}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-4">
        <a href={buildReplyUrl(message)} className={`${superPrimaryButtonClass} gap-2`}>
          <Send size={15} />
          Reply via email
        </a>
        <button
          type="button"
          onClick={() => onStatusChange(message._id, 'resolved')}
          className={superSecondaryButtonClass}
        >
          Mark resolved
        </button>
        <button
          type="button"
          onClick={() => onDelete(message._id)}
          disabled={deleting}
          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

function ContactMessageDrawer({ message, onClose, onStatusChange, onDelete, deleting }) {
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
        <ContactDetailPanel
          message={message}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          deleting={deleting}
        />
      </aside>
    </div>
  );
}
