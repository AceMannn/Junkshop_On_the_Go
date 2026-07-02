import { useEffect, useRef, useState } from 'react';
import { Bell, Inbox, LogOut } from 'lucide-react';

function formatNotificationDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SuperAdminTopbar({
  user,
  onLogout,
  unreadContactCount = 0,
  contactNotifications = [],
  onOpenContact,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const openContact = (messageId) => {
    setOpen(false);
    onOpenContact?.(messageId);
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-40 h-16 border-b border-zinc-200 bg-white/95 backdrop-blur-md md:left-64">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="min-w-0 md:hidden">
          <p className="truncate text-sm font-bold text-[#006c49]">JunkShop On the Go</p>
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="text-lg font-bold text-[#006c49]">JunkShop On the Go</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-95"
              aria-label={`${unreadContactCount} new contact messages`}
              aria-expanded={open}
            >
              <Bell size={18} />
              {unreadContactCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadContactCount > 9 ? '9+' : unreadContactCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
                <div className="border-b border-zinc-100 px-4 py-3">
                  <p className="text-sm font-bold text-[#191c1c]">Contact notifications</p>
                  <p className="text-xs text-zinc-500">
                    {unreadContactCount > 0
                      ? `${unreadContactCount} new message${unreadContactCount === 1 ? '' : 's'}`
                      : 'No new contact messages'}
                  </p>
                </div>

                {contactNotifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto py-1">
                    {contactNotifications.map((message) => (
                      <button
                        key={message._id}
                        type="button"
                        onClick={() => openContact(message._id)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-50"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <Inbox size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#191c1c]">
                            {message.subject}
                          </span>
                          <span className="block truncate text-xs text-zinc-500">
                            {message.name} · {message.email}
                          </span>
                          <span className="mt-1 block text-[11px] text-zinc-400">
                            {formatNotificationDate(message.createdAt)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-zinc-500">You&apos;re all caught up.</div>
                )}

                <button
                  type="button"
                  onClick={() => openContact()}
                  className="w-full border-t border-zinc-100 px-4 py-3 text-center text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  View contact inbox
                </button>
              </div>
            )}
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[#191c1c]">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-zinc-500">Super Admin</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 active:scale-[0.98]"
          >
            <LogOut size={15} className="mr-1.5 inline" />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
