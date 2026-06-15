import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import {
  AuthModalClose,
  AuthErrorPopup,
  authInputClass,
  authInputWithIconClass,
  authLabelClass,
  authOverlayClass,
  authModalShellClass,
  authRoleHints,
  authRoleTabClass,
  authRoleToggleWrapClass,
  authSubmitClass,
} from './auth/authModalUi';

export default function LoginScreen({
  onLoginSuccess,
  onClose,
  onShowSignUp,
  initialEmail = '',
  initialRole = 'customer',
  successMessage = '',
}) {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
    setSelectedRole(initialRole);
    setPassword('');
    setResetToken('');
    setNewPassword('');
    setError('');
    setInfo('');
    setView('login');
  }, [initialEmail, initialRole, successMessage]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email || !password) {
      setError('Please enter both email and password to continue.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await authApi.login({
        email,
        password,
        role: selectedRole,
      });
      onLoginSuccess(session);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email) {
      setError('Enter your account email.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.forgotPassword({ email });
      setInfo(
        data.message || 'If that email is registered, a reset code was generated.'
      );

      if (import.meta.env.DEV && data.resetToken) {
        setResetToken(data.resetToken);
        setInfo(
          `${data.message || 'Reset code generated.'} Dev code: ${data.resetToken}`
        );
      }
    } catch (forgotError) {
      setError(forgotError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email || !resetToken || !newPassword) {
      setError('Email, reset code, and new password are required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.resetPassword({
        email,
        resetToken,
        newPassword,
      });
      setInfo(data.message || 'Password reset successful.');
      setPassword('');
      setResetToken('');
      setNewPassword('');
      setView('login');
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const titles = {
    login: 'Welcome Back',
    forgot: 'Forgot Password',
    reset: 'Reset Password',
  };

  const subtitles = {
    login: 'Login to continue using JunkShop On-The-Go',
    forgot: 'Enter your email to receive a reset code',
    reset: 'Enter your reset code and choose a new password',
  };

  const scrollableViews = view === 'reset';

  return (
    <div
      className={authOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      onClick={onClose}
    >
      <div
        className={`${authModalShellClass} max-w-md ${
          scrollableViews ? '' : 'max-h-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative p-5 sm:p-6 ${
            scrollableViews
              ? `scroll-y-clean min-h-0 flex-1 overflow-y-auto ${error ? 'overflow-hidden' : ''}`
              : ''
          }`}
        >
          {onClose && <AuthModalClose onClick={onClose} label="Close login" />}

          <header className="mb-4 pr-10">
            <h1 id="login-title" className="text-xl font-bold text-charcoal mb-1">
              {titles[view]}
            </h1>
            <p className="text-charcoal/60 text-sm leading-snug">{subtitles[view]}</p>
          </header>

          {view === 'login' && (
            <>
              <div className={authRoleToggleWrapClass}>
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={authRoleTabClass(selectedRole === 'customer')}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('provider')}
                  className={authRoleTabClass(selectedRole === 'provider')}
                >
                  Provider
                </button>
              </div>
              <p className="text-xs text-charcoal/50 mb-4">{authRoleHints[selectedRole]}</p>
            </>
          )}

          {successMessage && view === 'login' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {info && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700 break-all">{info}</p>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className={authLabelClass}>
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="your@email.com"
                  className={authInputClass}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className={authLabelClass}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    className={authInputWithIconClass}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60"
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError('');
                      setInfo('');
                    }}
                    className="text-eco-green hover:text-eco-green/80 font-medium text-sm transition-colors"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className={authSubmitClass}>
                {isLoading
                  ? 'Logging in...'
                  : `Log in as ${selectedRole === 'customer' ? 'Customer' : 'Provider'}`}
              </button>

              <p className="text-xs text-charcoal/50">Your account is protected securely.</p>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className={authLabelClass}>
                  Email address
                </label>
                <input
                  type="email"
                  id="forgot-email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="your@email.com"
                  className={authInputClass}
                  disabled={isLoading}
                />
              </div>

              <button type="submit" disabled={isLoading} className={authSubmitClass}>
                {isLoading ? 'Sending...' : 'Get reset code'}
              </button>

              {resetToken && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setView('reset');
                      setError('');
                    }}
                    className="text-eco-green hover:text-eco-green/80 font-semibold text-sm"
                  >
                    Enter reset code →
                  </button>
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                    setInfo('');
                  }}
                  className="text-charcoal/60 hover:text-charcoal text-sm"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className={authLabelClass}>
                  Email address
                </label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="your@email.com"
                  className={authInputClass}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="reset-token" className={authLabelClass}>
                  Reset code
                </label>
                <input
                  type="text"
                  id="reset-token"
                  value={resetToken}
                  onChange={(e) => {
                    setResetToken(e.target.value);
                    setError('');
                  }}
                  placeholder="Paste reset code"
                  className={authInputClass}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="new-password" className={authLabelClass}>
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    className={authInputWithIconClass}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60"
                    disabled={isLoading}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showNewPassword}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className={authSubmitClass}>
                {isLoading ? 'Resetting...' : 'Reset password'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                    setInfo('');
                  }}
                  className="text-charcoal/60 hover:text-charcoal text-sm"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          {view === 'login' && (
            <p className="mt-4 text-sm text-charcoal/60">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="text-eco-green hover:text-eco-green/80 font-semibold transition-colors"
                disabled={isLoading}
                onClick={onShowSignUp}
              >
                Sign up
              </button>
            </p>
          )}
        </div>
        <AuthErrorPopup message={error} onDismiss={() => setError('')} />
      </div>
    </div>
  );
}
