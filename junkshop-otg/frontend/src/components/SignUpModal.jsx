import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../services/api';
import ProviderSignUpWizard from './ProviderSignUpWizard';
import AccountVerificationStep from './auth/AccountVerificationStep';
import {
  AUTH_DRAFT_KEYS,
  clearSignUpDrafts,
  loadAuthDraft,
  loadCustomerSignUpDraft,
  saveAuthDraft,
  saveCustomerSignUpDraft,
} from '../utils/authFormDraft';
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
import { validatePasswordStrength } from '../utils/passwordPolicy';
import PasswordRequirements from './auth/PasswordRequirements';
import TermsAndConditionsModal, { TERMS_VERSION } from './auth/TermsAndConditionsModal';

const EMPTY_CUSTOMER_FORM = {
  firstName: '',
  middleName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

function readCustomerDraft() {
  const draft = loadCustomerSignUpDraft();
  return draft?.formData || { ...EMPTY_CUSTOMER_FORM };
}

export default function SignUpModal({ isOpen, onClose, onSignUpComplete, onShowLogin }) {
  const metaDraft = loadAuthDraft(AUTH_DRAFT_KEYS.SIGNUP_META);
  const customerDraft = loadCustomerSignUpDraft();

  const [selectedRole, setSelectedRole] = useState(metaDraft?.selectedRole || 'customer');
  const [formData, setFormData] = useState(readCustomerDraft);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(customerDraft?.step || 'form');
  const [verificationData, setVerificationData] = useState(null);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    saveAuthDraft(AUTH_DRAFT_KEYS.SIGNUP_META, { selectedRole });
  }, [selectedRole]);

  useEffect(() => {
    if (selectedRole !== 'customer') return;
    saveCustomerSignUpDraft({ formData, step });
  }, [formData, step, selectedRole]);

  if (!isOpen) {
    return null;
  }

  if (selectedRole === 'provider') {
    return (
      <ProviderSignUpWizard
        isOpen={isOpen}
        onClose={onClose}
        onComplete={onSignUpComplete}
        onShowLogin={onShowLogin}
        onSwitchToCustomer={() => setSelectedRole('customer')}
      />
    );
  }

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    const normalizedPhone = formData.phone.replace(/\D/g, '').slice(0, 11);
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setError('Enter a valid mobile number (09XXXXXXXXX).');
      return;
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.ok) {
      setError(passwordValidation.message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.acceptedTerms) {
      setError('Please read and accept the Terms and Conditions before creating an account.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await authApi.register({
        role: 'customer',
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        phone: normalizedPhone,
        email: formData.email.trim() || undefined,
        password: formData.password,
        termsAccepted: true,
        termsVersion: TERMS_VERSION,
      });

      if (result.requiresAccountVerification || result.requiresEmailVerification || result.requiresPhoneVerification) {
        setVerificationData({
          email: result.email || formData.email.trim().toLowerCase(),
          phone: result.phone || normalizedPhone,
          role: 'customer',
          requiresEmail: Boolean(result.requiresEmailVerification),
          requiresPhone: Boolean(result.requiresPhoneVerification),
          message: result.message || 'Check your email/SMS for verification codes.',
          devEmailCode: result.devEmailVerificationCode || result.devVerificationCode || '',
          devPhoneCode: result.devPhoneVerificationCode || '',
        });
        setStep('verify');
        setError('');
        return;
      }

      onSignUpComplete?.(result);
      clearSignUpDrafts();
      onClose();
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={authOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-title"
      onClick={onClose}
    >
      <div
        className={`${authModalShellClass} max-w-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`scroll-y-clean relative min-h-0 flex-1 p-5 sm:p-6 ${
            error ? 'overflow-hidden' : ''
          }`}
        >
          <AuthModalClose onClick={onClose} label="Close sign up" />

          <header className="mb-4 pr-10">
            <h2 id="signup-title" className="text-xl font-bold text-charcoal mb-1">
              {step === 'verify' ? 'Verify your account' : 'Create Account'}
            </h2>
            <p className="text-charcoal/60 text-sm">
              {step === 'verify'
                ? 'Enter the code we sent to activate your customer account.'
                : 'Join JunkShop On-The-Go community'}
            </p>
          </header>

          {step === 'verify' ? (
            <AccountVerificationStep
              email={verificationData?.email || ''}
              phone={verificationData?.phone || ''}
              role={verificationData?.role || 'customer'}
              requiresEmail={verificationData?.requiresEmail}
              requiresPhone={verificationData?.requiresPhone}
              initialDevEmailCode={verificationData?.devEmailCode || ''}
              initialDevPhoneCode={verificationData?.devPhoneCode || ''}
              initialMessage={verificationData?.message || ''}
              onVerified={(session) => {
                setFormData(EMPTY_CUSTOMER_FORM);
                setStep('form');
                setVerificationData(null);
                clearSignUpDrafts();
                onSignUpComplete?.(session);
                onClose();
              }}
              onBack={() => {
                setStep('form');
                setError('');
              }}
              verifyLabel="Verify & continue"
            />
          ) : (
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className={authLabelClass}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Juan"
                  className={authInputClass}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="middleName" className={authLabelClass}>
                  Middle Name{' '}
                  <span className="text-charcoal/40 font-normal text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  placeholder="Optional"
                  className={authInputClass}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="lastName" className={authLabelClass}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Dela Cruz"
                  className={authInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-phone" className={authLabelClass}>
                Mobile number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="signup-phone"
                inputMode="numeric"
                maxLength={11}
                value={formData.phone}
                onChange={(e) =>
                  handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 11))
                }
                placeholder="09XXXXXXXXX"
                className={authInputClass}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="signup-email" className={authLabelClass}>
                Email address{' '}
                <span className="text-charcoal/40 font-normal text-xs">(optional)</span>
              </label>
              <input
                type="email"
                id="signup-email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                className={authInputClass}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-password" className={authLabelClass}>
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signup-password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
              </div>

              <div>
                <label htmlFor="confirmPassword" className={authLabelClass}>
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className={authInputWithIconClass}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60"
                    disabled={isLoading}
                    aria-label={
                      showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
              <PasswordRequirements password={formData.password} />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-charcoal/75">
              <input
                type="checkbox"
                checked={formData.acceptedTerms}
                onChange={(e) => handleInputChange('acceptedTerms', e.target.checked)}
                className="mt-1"
                disabled={isLoading}
              />
              <span>
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="font-semibold text-eco-green hover:text-eco-green/80"
                >
                  Terms and Conditions
                </button>
                .
              </span>
            </label>

            <button type="submit" disabled={isLoading} className={authSubmitClass}>
              {isLoading ? 'Creating Account...' : 'Sign up as Customer'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-charcoal/60">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onShowLogin}
              className="text-eco-green hover:text-eco-green/80 font-semibold transition-colors"
              disabled={isLoading}
            >
              Log in
            </button>
          </p>
            </>
          )}
        </div>
        <AuthErrorPopup message={error} onDismiss={() => setError('')} />
      </div>
      <TermsAndConditionsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        role="customer"
      />
    </div>
  );
}
