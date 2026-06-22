import { useState } from 'react';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { authApi } from '../services/api';

const inputClass =
  'w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]';

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
    <div className="min-h-screen bg-[#f3f4f1] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-[#154212]">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#191c1c]">JunkShop Admin Portal</h1>
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
              className={inputClass}
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
                className={`${inputClass} pr-11`}
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

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#154212] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f3310] disabled:opacity-60"
          >
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
