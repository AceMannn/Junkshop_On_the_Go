import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import { formatDate, statusPillClass } from '../utils/format';
import { adminCardClass, adminPageTitleClass, adminSelectClass } from '../utils/adminUi';

export default function ContactPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);

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
    } catch (err) {
      setError(err.message || 'Could not update message status.');
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
            <article key={row._id} className={`${adminCardClass} p-4 sm:p-5 space-y-3`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[#191c1c]">{row.subject}</p>
                  <p className="text-sm text-zinc-500">
                    {row.name} · {row.email}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{formatDate(row.createdAt)}</p>
                </div>
                <select
                  value={row.status}
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
