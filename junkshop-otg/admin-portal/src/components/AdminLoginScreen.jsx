import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';
import logoImage from '@shared-assets/junkshop-logo.png';
import { adminInputClass, adminPrimaryButtonClass } from '../utils/adminUi';

export default function AdminLoginScreen({ onLoginSuccess, sessionExpiredMessage = '' }) {
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
      setError('Enter your admin email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await authApi.login({
        identifier: cleanedEmail,
        password,
        role: 'admin',
      });

      if (session.user?.role !== 'admin') {
        setError('This account is not authorized for the admin portal.');
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
    <div className="min-h-screen bg-[#f9f9f8] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(61,163,93,0.08),_transparent_55%)] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <img
            src={logoImage}
            alt="JunkShop On-The-Go"
            className="h-12 w-12 rounded-xl object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-[#191c1c]">JunkShop Admin</h1>
            <p className="text-sm text-zinc-500">Staff sign-in only</p>
          </div>
        </div>

        {info && (
          <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            {info}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="block text-sm font-semibold text-[#42493e]">
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={adminInputClass}
              placeholder="admin@junkshop-otg.ph"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-password" className="block text-sm font-semibold text-[#42493e]">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${adminInputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((open) => !open)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className={`${adminPrimaryButtonClass} w-full py-3`}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Customers and junkshop owners use the public JunkShop On-The-Go site.
        </p>
      </div>
    </div>
  );
}
