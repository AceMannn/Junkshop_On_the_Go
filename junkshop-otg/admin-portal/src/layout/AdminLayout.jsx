import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, Mail, Shield, Users } from 'lucide-react';
import AdminTopbar from './AdminTopbar';
import { adminSidebarLinkClass } from '../utils/adminUi';

const navItems = [
  { to: '/overview', label: 'Overview', icon: Shield, end: false },
  { to: '/applications', label: 'Applications', icon: ClipboardList, end: false },
  { to: '/users', label: 'Users', icon: Users, end: false },
  { to: '/contact', label: 'Contact', icon: Mail, end: false },
];

export default function AdminLayout({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c]">
      <AdminTopbar user={user} onLogout={onLogout} />

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
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 md:pl-56 min-h-[calc(100vh-4rem)]">
          <div className="border-b border-zinc-200 bg-white md:hidden">
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-600'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
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
