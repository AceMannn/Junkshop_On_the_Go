import { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import ProviderSignUpWizard from './ProviderSignUpWizard';
import AccountVerificationStep from './auth/AccountVerificationStep';
import {
  AUTH_DRAFT_KEYS,
  clearSignUpDrafts,
  loadAuthDraft,
  loadCustomerSignUpDraft,
  resetSignUpMetaRole,
  saveAuthDraft,
  saveCustomerSignUpDraft,
} from '../utils/authFormDraft';
import {
  AuthModalClose,
  AuthErrorPopup,
  authInputClass,
  authLabelClass,
  authOverlayClass,
  authModalShellClass,
  authRoleHints,
  authRoleTabClass,
  authRoleToggleWrapClass,
  authSubmitClass,
} from './auth/authModalUi';
import { validatePasswordStrength } from '../utils/passwordPolicy';
import SignUpPasswordFields from './auth/SignUpPasswordFields';
import TermsAndConditionsModal, { TERMS_VERSION } from './auth/TermsAndConditionsModal';
import PrivacyPolicyModal from './auth/PrivacyPolicyModal';

const EMPTY_CUSTOMER_FORM = {
  firstName: '',
  middleName: '',
  lastName: '',
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(customerDraft?.step || 'form');
  const [verificationData, setVerificationData] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    saveAuthDraft(AUTH_DRAFT_KEYS.SIGNUP_META, { selectedRole });
  }, [selectedRole]);

  useEffect(() => {
    if (selectedRole !== 'customer') return;
    saveCustomerSignUpDraft({ formData, step });
  }, [formData, step, selectedRole]);

  const resetSignUpEntry = () => {
    setSelectedRole('customer');
    resetSignUpMetaRole();
  };

  const handleClose = () => {
    resetSignUpEntry();
    onClose();
  };

  const handleShowLogin = () => {
    resetSignUpEntry();
    onShowLogin?.();
  };

  if (!isOpen) {
    return null;
  }

  if (selectedRole === 'provider') {
    return (
      <ProviderSignUpWizard
        isOpen={isOpen}
        onClose={handleClose}
        onComplete={onSignUpComplete}
        onShowLogin={handleShowLogin}
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

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
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
      setError('Accept the Terms and Privacy Policy first.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await authApi.register({
        role: 'customer',
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email.trim(),
        password: formData.password,
        termsAccepted: true,
        termsVersion: TERMS_VERSION,
      });

      if (result.requiresAccountVerification || result.requiresEmailVerification || result.requiresPhoneVerification) {
        setVerificationData({
          email: result.email || formData.email.trim().toLowerCase(),
          phone: result.phone || '',
          role: 'customer',
          requiresEmail: true,
          requiresPhone: false,
          message: result.message || 'Check your email for the verification code.',
        });
        setStep('verify');
        setError('');
        return;
      }

      onSignUpComplete?.(result);
      clearSignUpDrafts();
      handleClose();
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
      onClick={handleClose}
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
          <AuthModalClose onClick={handleClose} label="Close sign up" />

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
              initialMessage={verificationData?.message || ''}
              onVerified={(session) => {
                setFormData(EMPTY_CUSTOMER_FORM);
                setStep('form');
                setVerificationData(null);
                clearSignUpDrafts();
                onSignUpComplete?.(session);
                handleClose();
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
              <label htmlFor="signup-email" className={authLabelClass}>
                Email address <span className="text-red-500">*</span>
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

            <SignUpPasswordFields
              password={formData.password}
              confirmPassword={formData.confirmPassword}
              onPasswordChange={(value) => handleInputChange('password', value)}
              onConfirmChange={(value) => handleInputChange('confirmPassword', value)}
              disabled={isLoading}
              passwordId="signup-password"
              confirmId="signup-confirm-password"
            />

            <label className="flex items-start gap-2.5 text-sm leading-snug text-charcoal/75">
              <input
                type="checkbox"
                checked={formData.acceptedTerms}
                onChange={(e) => handleInputChange('acceptedTerms', e.target.checked)}
                className="mt-0.5 shrink-0"
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
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="font-semibold text-eco-green hover:text-eco-green/80"
                >
                  Privacy Policy
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
              onClick={handleShowLogin}
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
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}
