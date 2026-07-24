import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Contact,
  Database,
  FileDown,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import logoImage from '@shared-assets/junkshop-logo.png';
import SuperAdminTopbar from './SuperAdminTopbar';
import { superAdminApi } from '../services/api';
import { superMobileNavClass, superSidebarLinkClass } from '../utils/superAdminUi';

const operationsNav = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/applications', label: 'Applications', icon: ClipboardList },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/contact', label: 'Contact', icon: Contact },
  { to: '/logs', label: 'Logs', icon: History },
  { to: '/deleted-records', label: 'Deleted Records', icon: Database },
];

const governanceNav = [
  { to: '/admin-management', label: 'Admin Management', icon: UserCog },
  { to: '/system-settings', label: 'System Settings', icon: Settings },
  { to: '/data-export', label: 'Data Export', icon: FileDown },
  { to: '/permanent-delete', label: 'Permanent Delete', icon: Trash2 },
];

const allNavItems = [...operationsNav, ...governanceNav];

function SidebarNav({ items, onNavigate }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) => superSidebarLinkClass(isActive)}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

export default function SuperAdminLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const [unreadContactCount, setUnreadContactCount] = useState(0);
  const [contactNotifications, setContactNotifications] = useState([]);

  const refreshUnreadContactCount = useCallback(async () => {
    try {
      const [overview, contactData] = await Promise.all([
        superAdminApi.getOverview(),
        superAdminApi.listContactMessages(),
      ]);
      setUnreadContactCount(overview.stats?.unreadContactMessages || 0);
      setContactNotifications(
        (contactData.messages || []).filter((row) => row.status === 'new').slice(0, 5)
      );
    } catch {
      // Keep navigation usable even if the badge count cannot load.
    }
  }, []);

  useEffect(() => {
    refreshUnreadContactCount();
    const interval = window.setInterval(refreshUnreadContactCount, 30000);
    window.addEventListener('super-admin-contact-updated', refreshUnreadContactCount);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('super-admin-contact-updated', refreshUnreadContactCount);
    };
  }, [refreshUnreadContactCount]);

  const openContactInbox = (messageId) => {
    navigate(messageId ? `/contact?message=${messageId}` : '/contact');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#191c1c]">
      <SuperAdminTopbar
        user={user}
        onLogout={onLogout}
        unreadContactCount={unreadContactCount}
        contactNotifications={contactNotifications}
        onOpenContact={openContactInbox}
      />

      <aside className="fixed top-0 left-0 z-50 hidden h-screen w-64 flex-col bg-[#3f465c] md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="" className="h-10 w-10 rounded-lg object-contain bg-white/10 p-1" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Super Admin</p>
              <p className="text-xs text-slate-400">Administrative Oversight</p>
            </div>
          </div>
        </div>

        <nav className="scroll-y-clean flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operations
          </p>
          <SidebarNav items={operationsNav} />

          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Governance
          </p>
          <SidebarNav items={governanceNav} />
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col pt-16 md:pl-64">
        <div className="border-b border-zinc-200 bg-white md:hidden">
          <div className="scroll-x-clean flex gap-2 px-4 py-3">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => superMobileNavClass(isActive)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon size={14} className="shrink-0" />
                  {item.label}
                </span>
              </NavLink>
            );
            })}
          </div>
        </div>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
