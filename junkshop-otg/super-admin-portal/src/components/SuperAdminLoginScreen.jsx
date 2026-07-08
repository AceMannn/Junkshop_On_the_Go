import { useState } from 'react';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { authApi } from '../services/api';
import logoImage from '@shared-assets/junkshop-logo.png';
import { superInputClass, superPrimaryButtonClass } from '../utils/superAdminUi';

export default function SuperAdminLoginScreen({ onLoginSuccess, sessionExpiredMessage = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(sessionExpiredMessage);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail || !password) {
      setError('Enter your administrator email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await authApi.login({
        identifier: cleanedEmail,
        password,
        role: 'super_admin',
      });

      if (session.user?.role !== 'super_admin') {
        setError('This account is not authorized for the super admin portal.');
        return;
      }

      onLoginSuccess(session);
    } catch (loginError) {
      setError(loginError.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,108,73,0.06),_transparent_55%)] pointer-events-none" />

      <main className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#006c49] shadow-sm">
            <img src={logoImage} alt="" className="h-10 w-10 rounded-lg object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#191c1c]">Super Admin</h1>
          <p className="mt-1 text-sm text-zinc-500">Authorized personnel only</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          {info && (
            <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              {info}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="super-admin-email" className="mb-2 block text-sm font-semibold text-[#191c1c]">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="super-admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${superInputClass} pl-10`}
                  placeholder="superadmin@junkshop-otg.ph"
                />
              </div>
            </div>

            <div>
              <label htmlFor="super-admin-password" className="mb-2 block text-sm font-semibold text-[#191c1c]">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="super-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${superInputClass} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((open) => !open)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={`${superPrimaryButtonClass} w-full py-3`}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In to Dashboard
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-400">JunkShop On the Go · Super Admin Portal</p>
      </main>
    </div>
  );
}
