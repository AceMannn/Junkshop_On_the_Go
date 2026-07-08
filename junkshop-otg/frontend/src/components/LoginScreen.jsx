import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react';
import logoImage from '../assets/junkshop-logo.png';
import { authApi } from '../services/api';
import {
  AuthModalClose,
  AuthErrorPopup,
  authInputClass,
  authInputWithIconClass,
  authPasswordToggleButtonClass,
  authLabelClass,
  authOverlayClass,
  authModalShellClass,
  authSubmitClass,
} from './auth/authModalUi';
import AccountVerificationStep from './auth/AccountVerificationStep';
import PasswordRequirements from './auth/PasswordRequirements';
import {
  clearLoginDraft,
  loadLoginDraft,
  saveLoginDraft,
} from '../utils/authFormDraft';
import { validatePasswordStrength } from '../utils/passwordPolicy';

const OTP_LENGTH = 6;
const RESET_STEPS = ['Code', 'Verify', 'New password'];

function ResetStepIndicator({ step }) {
  return (
    <div className="flex items-center gap-1 mb-5">
      {RESET_STEPS.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex items-center gap-1 min-w-0">
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
                active ? 'text-[#154212]' : done ? 'text-emerald-600' : 'text-charcoal/30'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  active
                    ? 'bg-[#154212] text-white'
                    : done
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-zinc-100 text-charcoal/40'
                }`}
              >
                {num}
              </span>
              {label}
            </div>
            {i < RESET_STEPS.length - 1 && (
              <div
                className={`h-px w-5 shrink-0 mx-1 ${done ? 'bg-emerald-300' : 'bg-zinc-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function maskContact(contact) {
  const c = String(contact || '').trim();
  if (c.includes('@')) {
    const [local, domain] = c.split('@');
    return `${local.slice(0, 2)}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`;
  }
  if (c.length >= 6) {
    return `${c.slice(0, 3)}${'*'.repeat(c.length - 5)}${c.slice(-2)}`;
  }
  return c;
}

function readLoginDraft() {
  return loadLoginDraft();
}

export default function LoginScreen({
  onLoginSuccess,
  onClose,
  onShowSignUp,
  initialEmail = '',
  successMessage = '',
}) {
  const savedDraft = readLoginDraft();

  const PERSISTENT_VIEWS = ['login', 'verifyAccount'];
  const [view, setView] = useState(
    PERSISTENT_VIEWS.includes(savedDraft.view) ? savedDraft.view : 'login'
  );
  const [email, setEmail] = useState(() => initialEmail || savedDraft.email || '');
  const [recoveryContact, setRecoveryContact] = useState(
    () => initialEmail || savedDraft.recoveryContact || savedDraft.email || ''
  );
  const [password, setPassword] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(savedDraft.rememberMe));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (view === 'resetCode') {
      otpInputRef.current?.focus();
    }
  }, [view]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setRecoveryContact(initialEmail);
    }
    if (successMessage) {
      setPassword('');
    }
  }, [initialEmail, successMessage]);

  useEffect(() => {
    saveLoginDraft({
      view,
      email,
      recoveryContact,
      rememberMe,
    });
  }, [view, email, recoveryContact, rememberMe]);

  const handleClose = () => {
    saveLoginDraft({
      view: 'login',
      email,
      recoveryContact,
      rememberMe,
    });
    onClose?.();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email || !password) {
      setError('Please enter your email address and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await authApi.login({
        identifier: email.trim(),
        email: email.trim(),
        password,
      });
      onLoginSuccess({ ...session, rememberMe });
      clearLoginDraft();
    } catch (loginError) {
      if (
        loginError.requiresAccountVerification ||
        loginError.requiresEmailVerification ||
        loginError.requiresPhoneVerification
      ) {
        setVerificationData({
          email: loginError.email || email.trim(),
          phone: loginError.phone || '',
          role: loginError.role || '',
          requiresEmail: Boolean(loginError.requiresEmailVerification),
          requiresPhone: false,
          message: loginError.message,
        });
        setView('verifyAccount');
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
        setResetOtp(String(data.resetToken).replace(/\D/g, '').slice(0, OTP_LENGTH));
        setInfo(`${data.message} Dev code: ${data.resetToken}`);
      } else {
        setResetOtp('');
        setInfo('');
      }

      setView('resetCode');
    } catch (forgotError) {
      setError(forgotError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      const data = await authApi.forgotPassword({ identifier: recoveryContact.trim() });
      if (import.meta.env.DEV && data.resetToken) {
        setResetOtp(String(data.resetToken).replace(/\D/g, '').slice(0, OTP_LENGTH));
        setInfo(`Code resent. Dev code: ${data.resetToken}`);
      } else {
        setInfo(data.message || 'A new reset code was sent.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (resetOtp.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email or SMS.`);
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.verifyResetCode({
        identifier: recoveryContact.trim(),
        resetToken: resetOtp,
      });
      setSessionToken(data.sessionToken || '');
      setResetOtp('');
      setInfo('');
      setView('resetPassword');
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.ok) {
      setError(passwordValidation.message);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        identifier: recoveryContact.trim(),
        sessionToken,
        newPassword,
      });
      setSessionToken('');
      setNewPassword('');
      setConfirmPassword('');
      setView('resetSuccess');
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const titles = {
    login: 'Welcome Back',
    forgot: 'Forgot Password',
    resetCode: 'Check your inbox',
    resetPassword: 'Create new password',
    resetSuccess: 'Password changed',
    verifyAccount: 'Verify your account',
  };

  const subtitles = {
    login: 'Sign in with your email',
    forgot: 'Enter your email to receive a reset code',
    resetCode: `We sent a ${OTP_LENGTH}-digit code to ${maskContact(recoveryContact)}`,
    resetPassword: 'Choose a strong password for your account',
    resetSuccess: '',
    verifyAccount: 'Enter the verification code to activate your account',
  };

  const isForgotView = ['forgot', 'resetCode', 'resetPassword'].includes(view);
  const forgotStep = view === 'forgot' ? 1 : view === 'resetCode' ? 2 : 3;

  return (
    <div
      className={authOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      onClick={handleClose}
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
          {onClose && <AuthModalClose onClick={handleClose} label="Close login" />}

          {view === 'resetSuccess' ? (
            <div className="flex flex-col items-center text-center py-6 gap-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-600" strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-charcoal mb-1">Password changed</h1>
                <p className="text-charcoal/60 text-sm leading-snug max-w-xs mx-auto">
                  Your password was updated successfully. You can now log in with your new password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                  setInfo('');
                  setRecoveryContact('');
                }}
                className={authSubmitClass}
              >
                Back to login
              </button>
            </div>
          ) : (
            <>
              {view === 'login' && (
                <div className="mb-5 flex justify-center">
                  <img
                    src={logoImage}
                    alt="JunkShop On-The-Go"
                    className="h-11 sm:h-12 w-auto max-w-[11rem] sm:max-w-[13rem] object-contain"
                  />
                </div>
              )}

              <header className={`mb-4 ${view === 'login' ? 'text-center' : 'pr-10'}`}>
                <h1 id="login-title" className="text-xl font-bold text-charcoal mb-1">
                  {titles[view]}
                </h1>
                {subtitles[view] ? (
                  <p className="text-charcoal/60 text-sm leading-snug">{subtitles[view]}</p>
                ) : null}
              </header>

              {isForgotView && <ResetStepIndicator step={forgotStep} />}

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
                      autoComplete="email"
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
                        className={authPasswordToggleButtonClass}
                        disabled={isLoading}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm text-charcoal/65">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(event) => setRememberMe(event.target.checked)}
                          disabled={isLoading}
                        />
                        Remember me
                      </label>
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
                    {isLoading ? 'Logging in...' : 'Log in'}
                  </button>
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-recovery" className={authLabelClass}>
                      Email address
                    </label>
                    <input
                      type="text"
                      id="forgot-recovery"
                      value={recoveryContact}
                      onChange={(e) => {
                        setRecoveryContact(e.target.value);
                        setError('');
                      }}
                      placeholder="your@email.com"
                      className={authInputClass}
                      disabled={isLoading}
                      autoFocus
                      autoComplete="email"
                    />
                    <p className="mt-2 text-xs text-charcoal/50">
                      We&apos;ll email your reset code. If email fails, a registered mobile number
                      may also work as backup.
                    </p>
                  </div>

                  <button type="submit" disabled={isLoading} className={authSubmitClass}>
                    {isLoading ? 'Sending code...' : 'Send reset code'}
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
                      ← Back to login
                    </button>
                  </div>
                </form>
              )}

              {view === 'resetCode' && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label htmlFor="reset-otp" className={authLabelClass}>
                      {OTP_LENGTH}-digit reset code
                    </label>
                    <input
                      ref={otpInputRef}
                      type="text"
                      id="reset-otp"
                      value={resetOtp}
                      onChange={(e) => {
                        setResetOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
                        setError('');
                      }}
                      placeholder={'0'.repeat(OTP_LENGTH)}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={OTP_LENGTH}
                      className={`${authInputClass} text-center text-xl tracking-[0.5em] font-bold`}
                      disabled={isLoading}
                    />
                    <p className="mt-2 text-xs text-charcoal/50 text-center">
                      Code expires in 1 hour. Check spam if you don&apos;t see it.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || resetOtp.length !== OTP_LENGTH}
                    className={authSubmitClass}
                  >
                    {isLoading ? 'Verifying...' : 'Verify code'}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-eco-green hover:text-eco-green/80 font-semibold"
                    >
                      Resend code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot');
                        setResetOtp('');
                        setError('');
                        setInfo('');
                      }}
                      disabled={isLoading}
                      className="text-charcoal/60 hover:text-charcoal"
                    >
                      Change contact
                    </button>
                  </div>
                </form>
              )}

              {view === 'resetPassword' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
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
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={authPasswordToggleButtonClass}
                        disabled={isLoading}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showNewPassword}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className={authLabelClass}>
                      Confirm new password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError('');
                        }}
                        placeholder="••••••••"
                        className={`${authInputWithIconClass} ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                            : ''
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={authPasswordToggleButtonClass}
                        disabled={isLoading}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showConfirmPassword}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && newPassword.length > 0 && (
                      <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Passwords match
                      </p>
                    )}
                  </div>

                  <PasswordRequirements password={newPassword} />

                  <button
                    type="submit"
                    disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                    className={authSubmitClass}
                  >
                    {isLoading ? 'Saving...' : 'Save new password'}
                  </button>
                </form>
              )}

              {view === 'verifyAccount' && (
                <AccountVerificationStep
                  email={verificationData?.email || ''}
                  phone={verificationData?.phone || ''}
                  role={verificationData?.role || undefined}
                  requiresEmail={verificationData?.requiresEmail}
                  initialMessage={verificationData?.message || ''}
                  onVerified={(session) => {
                    onLoginSuccess({ ...session, rememberMe });
                    clearLoginDraft();
                  }}
                  onBack={() => {
                    setView('login');
                    setVerificationData(null);
                    setError('');
                    setInfo('');
                  }}
                  verifyLabel="Verify & log in"
                />
              )}

              {view === 'login' && (
                <p className="mt-4 text-center text-sm text-charcoal/60">
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
            </>
          )}
        </div>
        <AuthErrorPopup message={error} onDismiss={() => setError('')} />
      </div>
    </div>
  );
}
