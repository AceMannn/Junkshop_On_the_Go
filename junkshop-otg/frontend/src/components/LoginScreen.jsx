import { useState, useEffect, useRef } from 'react';
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
import EmailVerificationStep from './auth/EmailVerificationStep';
import {
  clearLoginDraft,
  loadLoginDraft,
  saveLoginDraft,
} from '../utils/authFormDraft';
import { validatePasswordStrength } from '../utils/passwordPolicy';

const OTP_LENGTH = 6;

function readLoginDraft() {
  return loadLoginDraft();
}

export default function LoginScreen({
  onLoginSuccess,
  onClose,
  onShowSignUp,
  initialEmail = '',
  initialRole = 'customer',
  successMessage = '',
}) {
  const savedDraft = readLoginDraft();

  const [view, setView] = useState(savedDraft.view || 'login');
  const [email, setEmail] = useState(() => initialEmail || savedDraft.email || '');
  const [recoveryContact, setRecoveryContact] = useState(
    () => initialEmail || savedDraft.recoveryContact || savedDraft.email || ''
  );
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(
    () => initialRole || savedDraft.selectedRole || 'customer'
  );
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationDevCode, setVerificationDevCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (view === 'reset') {
      otpInputRef.current?.focus();
    }
  }, [view]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setRecoveryContact(initialEmail);
    }
    if (initialRole) {
      setSelectedRole(initialRole);
    }
    if (successMessage) {
      setPassword('');
    }
  }, [initialEmail, initialRole, successMessage]);

  useEffect(() => {
    saveLoginDraft({
      view,
      email,
      recoveryContact,
      selectedRole,
    });
  }, [view, email, recoveryContact, selectedRole]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email || !password) {
      setError(
        selectedRole === 'provider' || selectedRole === 'customer'
          ? 'Please enter your mobile number and password.'
          : 'Please enter your login details and password.'
      );
      return;
    }

    if (selectedRole === 'provider' || selectedRole === 'customer') {
      const normalizedPhone = email.replace(/\D/g, '').slice(0, 11);
      if (!/^09\d{9}$/.test(normalizedPhone)) {
        setError('Enter a valid mobile number (09XXXXXXXXX).');
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const session = await authApi.login({
        identifier:
          selectedRole === 'provider' || selectedRole === 'customer'
            ? email.replace(/\D/g, '').slice(0, 11)
            : email,
        email: selectedRole === 'provider' || selectedRole === 'customer' ? undefined : email,
        password,
        role: selectedRole,
      });
      onLoginSuccess(session);
      clearLoginDraft();
    } catch (loginError) {
      if (loginError.requiresEmailVerification) {
        setVerificationEmail(loginError.email || email);
        setVerificationMessage(loginError.message);
        setView('verifyEmail');
        setError('');
        return;
      }
      setError(loginError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!recoveryContact.trim()) {
      setError('Enter your registered email or mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.forgotPassword({ identifier: recoveryContact.trim() });

      if (import.meta.env.DEV && data.resetToken) {
        setResetToken(String(data.resetToken).replace(/\D/g, '').slice(0, OTP_LENGTH));
        setInfo(`${data.message} Dev code (no SendGrid/Twilio): ${data.resetToken}`);
      } else {
        setResetToken('');
        setInfo(
          data.message ||
            'If that email or number is registered, a reset code has been sent.'
        );
      }

      setView('reset');
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

    if (!recoveryContact.trim() || !resetToken || !newPassword) {
      setError('Email or mobile number, reset code, and new password are required.');
      return;
    }

    if (resetToken.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email or SMS.`);
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.ok) {
      setError(passwordValidation.message);
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.resetPassword({
        identifier: recoveryContact.trim(),
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
    verifyEmail: 'Verify your email',
  };

  const subtitles = {
    login: 'Login to continue using JunkShop On-The-Go',
    forgot: 'Enter your email or mobile number (09XXXXXXXXX) to get a reset code',
    reset: `Enter the ${OTP_LENGTH}-digit code we sent, then choose a new password`,
    verifyEmail: 'Enter the verification code to activate your customer account',
  };

  return (
    <div
      className={authOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      onClick={onClose}
    >
      <div
        className={`${authModalShellClass} max-w-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative min-h-0 flex-1 p-5 sm:p-6 ${
            view === 'login' ? '' : 'scroll-y-clean'
          } ${error ? 'overflow-hidden' : ''}`}
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
                  Junkshop Owner
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
                  {selectedRole === 'provider' || selectedRole === 'customer'
                    ? 'Mobile number'
                    : 'Email address'}
                </label>
                <input
                  type={selectedRole === 'provider' || selectedRole === 'customer' ? 'tel' : 'email'}
                  id="email"
                  value={email}
                  onChange={(e) => {
                    const nextValue =
                      selectedRole === 'provider' || selectedRole === 'customer'
                        ? e.target.value.replace(/\D/g, '').slice(0, 11)
                        : e.target.value;
                    setEmail(nextValue);
                    setError('');
                  }}
                  placeholder={
                    selectedRole === 'provider' || selectedRole === 'customer'
                      ? '09XXXXXXXXX'
                      : 'your@email.com'
                  }
                  className={authInputClass}
                  disabled={isLoading}
                  autoComplete={
                    selectedRole === 'provider' || selectedRole === 'customer' ? 'tel' : 'email'
                  }
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
                      setRecoveryContact(email);
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
                  : `Log in as ${selectedRole === 'customer' ? 'Customer' : 'Junkshop Owner'}`}
              </button>

              <p className="text-xs text-charcoal/50">Your account is protected securely.</p>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-recovery" className={authLabelClass}>
                  Email or mobile number
                </label>
                <input
                  type="text"
                  id="forgot-recovery"
                  value={recoveryContact}
                  onChange={(e) => {
                    setRecoveryContact(e.target.value);
                    setError('');
                  }}
                  placeholder="your@email.com or 09XXXXXXXXX"
                  className={authInputClass}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <button type="submit" disabled={isLoading} className={authSubmitClass}>
                {isLoading ? 'Sending...' : 'Get reset code'}
              </button>

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
                <label htmlFor="reset-recovery" className={authLabelClass}>
                  Email or mobile number
                </label>
                <input
                  type="text"
                  id="reset-recovery"
                  value={recoveryContact}
                  onChange={(e) => {
                    setRecoveryContact(e.target.value);
                    setError('');
                  }}
                  placeholder="your@email.com or 09XXXXXXXXX"
                  className={authInputClass}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="reset-token" className={authLabelClass}>
                  {OTP_LENGTH}-digit code
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  id="reset-token"
                  value={resetToken}
                  onChange={(e) => {
                    setResetToken(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
                    setError('');
                  }}
                  placeholder={'0'.repeat(OTP_LENGTH)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  className={`${authInputClass} text-center text-lg tracking-[0.35em] font-semibold`}
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

          {view === 'verifyEmail' && (
            <EmailVerificationStep
              email={verificationEmail}
              initialDevCode={verificationDevCode}
              initialMessage={verificationMessage}
              onVerified={(session) => {
                onLoginSuccess(session);
      clearLoginDraft();
              }}
              onBack={() => {
                setView('login');
                setError('');
                setInfo('');
              }}
              verifyLabel="Verify & log in"
            />
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
