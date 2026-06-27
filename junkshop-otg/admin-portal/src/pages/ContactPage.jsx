import { useEffect, useState } from 'react';
import { ExternalLink, Inbox, Loader2, Mail, Send, X } from 'lucide-react';
import { adminApi } from '../services/api';
import { formatDate, statusPillClass } from '../utils/format';
import {
  adminCardClass,
  adminPageTitleClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
  adminSelectClass,
} from '../utils/adminUi';

export default function ContactPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
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

  const handleContactStatus = async (messageId, status) => {
    try {
      await adminApi.updateContactMessageStatus(messageId, status);
      setMessages((prev) =>
        prev.map((row) => (row._id === messageId ? { ...row, status } : row))
      );
      setSelectedMessage((prev) =>
        prev?._id === messageId ? { ...prev, status } : prev
      );
      window.dispatchEvent(new Event('admin-contact-updated'));
    } catch (err) {
      setError(err.message || 'Could not update message status.');
    }
  };

  const openMessage = async (row) => {
    setSelectedMessage(row);
    if (row.status !== 'new') return;

    try {
      await adminApi.updateContactMessageStatus(row._id, 'read');
      setMessages((prev) =>
        prev.map((item) => (item._id === row._id ? { ...item, status: 'read' } : item))
      );
      setSelectedMessage({ ...row, status: 'read' });
      window.dispatchEvent(new Event('admin-contact-updated'));
    } catch (err) {
      setError(err.message || 'Could not mark message as read.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Contact messages</h1>
        <p className="mt-1 text-sm text-[#5c6658]">
          Public contact form submissions from the website.
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
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className={`${adminCardClass} px-4 py-16 text-center text-zinc-500`}>
          No contact messages yet.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((row) => (
            <article
              key={row._id}
              role="button"
              tabIndex={0}
              onClick={() => openMessage(row)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openMessage(row);
                }
              }}
              className={`${adminCardClass} p-4 sm:p-5 space-y-3 cursor-pointer transition-all hover:border-emerald-200 hover:shadow-md ${
                row.status === 'new' ? 'ring-1 ring-emerald-100' : ''
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Mail size={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#191c1c]">{row.subject}</p>
                      {row.status === 'new' && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                          New
                        </span>
                      )}
                    </div>
                  <p className="text-sm text-zinc-500">
                    {row.name} · {row.email}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{formatDate(row.createdAt)}</p>
                  </div>
                </div>
                <select
                  value={row.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleContactStatus(row._id, e.target.value)}
                  className={`${adminSelectClass} capitalize`}
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPillClass(
                  row.status
                )}`}
              >
                {row.status}
              </span>
              <p className="text-sm text-[#42493e] whitespace-pre-wrap leading-relaxed">
                {row.message}
              </p>
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                Open details <ExternalLink size={12} />
              </p>
            </article>
          ))}
        </div>
      )}
      {selectedMessage && (
        <ContactMessageDrawer
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onStatusChange={handleContactStatus}
        />
      )}
    </div>
  );
}

function buildReplyUrl(message) {
  const subject = encodeURIComponent(`Re: ${message.subject || 'JunkShop On-The-Go support'}`);
  const body = encodeURIComponent(
    `Hi ${message.name || 'there'},\n\n\n\n---\nOriginal message:\n${message.message || ''}`
  );
  return `mailto:${message.email}?subject=${subject}&body=${body}`;
}

function ContactMessageDrawer({ message, onClose, onStatusChange }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <div
        className="hidden flex-1 md:block"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="shrink-0 border-b border-zinc-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Contact message
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#191c1c] break-words">
                {message.subject}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
              aria-label="Close message details"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="scroll-y-clean flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className={`${adminCardClass} p-4`}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Inbox size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[#191c1c]">{message.name}</p>
                <a
                  href={`mailto:${message.email}`}
                  className="text-sm font-medium text-emerald-700 hover:underline"
                >
                  {message.email}
                </a>
                <p className="mt-1 text-xs text-zinc-500">{formatDate(message.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className={`${adminCardClass} p-4 space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                className={`${adminSelectClass} capitalize`}
              >
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <p className="whitespace-pre-wrap rounded-xl bg-[#f9f9f8] p-4 text-sm leading-relaxed text-[#42493e]">
              {message.message}
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-200 bg-[#f9f9f8] px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={buildReplyUrl(message)}
              className={`${adminPrimaryButtonClass} flex-1 gap-2`}
            >
              <Send size={15} />
              Reply via email
            </a>
            <button
              type="button"
              onClick={() => onStatusChange(message._id, 'resolved')}
              className={`${adminSecondaryButtonClass} flex-1`}
            >
              Mark resolved
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
