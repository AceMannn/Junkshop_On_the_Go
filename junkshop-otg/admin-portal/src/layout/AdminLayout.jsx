import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, History, Mail, RotateCcw, Shield, UserCog, Users } from 'lucide-react';
import AdminTopbar from './AdminTopbar';
import { adminApi } from '../services/api';
import { adminSidebarLinkClass } from '../utils/adminUi';

const navItems = [
  { to: '/overview', label: 'Overview', icon: Shield, end: false },
  { to: '/applications', label: 'Applications', icon: ClipboardList, end: false },
  { to: '/users', label: 'Users', icon: Users, end: false },
  { to: '/logs', label: 'Logs', icon: History, end: false },
  { to: '/deleted-records', label: 'Deleted Records', icon: RotateCcw, end: false },
  { to: '/admin-team', label: 'Admin Team', icon: UserCog, end: false },
  { to: '/contact', label: 'Contact', icon: Mail, end: false },
];

export default function AdminLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const [unreadContactCount, setUnreadContactCount] = useState(0);
  const [contactNotifications, setContactNotifications] = useState([]);

  const refreshUnreadContactCount = useCallback(async () => {
    try {
      const [overview, contactData] = await Promise.all([
        adminApi.getOverview(),
        adminApi.listContactMessages(),
      ]);
      setUnreadContactCount(overview.stats?.unreadContactMessages || 0);
      setContactNotifications((contactData.messages || []).filter((row) => row.status === 'new').slice(0, 5));
    } catch {
      // Keep navigation usable even if the badge count cannot load.
    }
  }, []);

  useEffect(() => {
    refreshUnreadContactCount();
    const interval = window.setInterval(refreshUnreadContactCount, 30000);
    window.addEventListener('admin-contact-updated', refreshUnreadContactCount);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('admin-contact-updated', refreshUnreadContactCount);
    };
  }, [refreshUnreadContactCount]);

  const openContactInbox = (messageId) => {
    navigate(messageId ? `/contact?message=${messageId}` : '/contact');
  };

  return (
    <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c]">
      <AdminTopbar
        user={user}
        onLogout={onLogout}
        unreadContactCount={unreadContactCount}
        contactNotifications={contactNotifications}
        onOpenContact={openContactInbox}
      />

      <div className="flex pt-16">
        <aside className="hidden md:flex fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-56 flex-col border-r border-zinc-200 bg-zinc-50">
          <nav className="scroll-y-clean flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => adminSidebarLinkClass(isActive)}
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/contact' && unreadContactCount > 0 && (
                    <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadContactCount > 9 ? '9+' : unreadContactCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 md:pl-56 min-h-[calc(100vh-4rem)]">
          <div className="border-b border-zinc-200 bg-white md:hidden">
            <div className="scroll-x-clean flex gap-2 px-4 py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-600'
                    }`
                  }
                >
                  <Icon size={14} className="shrink-0" />
                  <span>{item.label}</span>
                  {item.to === '/contact' && unreadContactCount > 0 && (
                    <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadContactCount > 9 ? '9+' : unreadContactCount}
                    </span>
                  )}
                </NavLink>
              );
              })}
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
