import { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Eye, EyeOff, MapPin } from 'lucide-react';
import { authApi } from '../services/api';
import LocationPickerMap from './maps/LocationPickerMap';
import {
  clearSignUpDrafts,
  loadProviderSignUpDraft,
  saveProviderSignUpDraft,
} from '../utils/authFormDraft';
import {
  AuthModalClose,
  AuthErrorPopup,
  authInputClass,
  authInputWithIconClass,
  authLabelClass,
  authModalShellClass,
  authOverlayClass,
  authSubmitClass,
} from './auth/authModalUi';
import {
  DEFAULT_OPERATING_HOURS,
  WEEKDAY_ROWS,
  copyWeekdayHours,
  formatOperatingHoursSummary,
  sanitizeOperatingHours,
} from '../utils/operatingHours';
import { validatePasswordStrength } from '../utils/passwordPolicy';
import AccountVerificationStep from './auth/AccountVerificationStep';
import PasswordRequirements from './auth/PasswordRequirements';
import TermsAndConditionsModal, { TERMS_VERSION } from './auth/TermsAndConditionsModal';

const STEPS = [
  { id: 1, title: 'Business info' },
  { id: 2, title: 'Owner account' },
  { id: 3, title: 'Operating hours' },
  { id: 4, title: 'Review' },
];

const initialForm = {
  junkshopName: '',
  address: '',
  firstName: '',
  middleName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  location: null,
  addressConfirmed: false,
  operatingHours: DEFAULT_OPERATING_HOURS,
  confirmAccurate: false,
  acceptedTerms: false,
};

function readProviderDraft() {
  const draft = loadProviderSignUpDraft();
  if (!draft?.form) return null;
  return {
    ...initialForm,
    ...draft.form,
    operatingHours: draft.form.operatingHours || DEFAULT_OPERATING_HOURS,
    addressConfirmed: Boolean(draft.form.addressConfirmed),
    password: '',
    confirmPassword: '',
  };
}

function StepIndicator({ step }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-eco-green">
        Step {step} of {STEPS.length}
      </p>
      <p className="text-sm font-semibold text-charcoal">{STEPS[step - 1].title}</p>
      <div className="mt-2 flex gap-1.5">
        {STEPS.map((item) => (
          <span
            key={item.id}
            className={`h-1.5 flex-1 rounded-full ${
              item.id <= step ? 'bg-eco-green' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProviderSignUpWizard({
  isOpen,
  onClose,
  onComplete,
  onShowLogin,
  onSwitchToCustomer,
}) {
  const providerDraft = loadProviderSignUpDraft();

  const [step, setStep] = useState(Math.min(providerDraft?.step ?? 1, STEPS.length));
  const [form, setForm] = useState(() => readProviderDraft() || initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  const hoursSummary = useMemo(
    () => formatOperatingHoursSummary(form.operatingHours),
    [form.operatingHours]
  );

  useEffect(() => {
    saveProviderSignUpDraft({ step, form });
  }, [step, form]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLocationChange = (nextLocation) => {
    setForm((prev) => ({
      ...prev,
      location: nextLocation,
      address: nextLocation.address || prev.address,
      addressConfirmed: false,
    }));
    setError('');
  };

  const canConfirmAddress =
    form.address.trim() &&
    Number.isFinite(Number(form.location?.lat)) &&
    Number.isFinite(Number(form.location?.lng));

  const confirmAddress = () => {
    if (!canConfirmAddress) {
      setError('Search and select your business address on the map first.');
      return;
    }
    updateField('addressConfirmed', true);
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!form.junkshopName.trim() || !form.address.trim()) {
        return 'Business name and address are required.';
      }
      if (
        !Number.isFinite(Number(form.location?.lat)) ||
        !Number.isFinite(Number(form.location?.lng))
      ) {
        return 'Search your business address and set the map pin.';
      }
      if (!form.addressConfirmed) {
        return 'Please confirm your business address before continuing.';
      }
    }

    if (currentStep === 2) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        return 'First and last name are required.';
      }
      if (!/^09\d{9}$/.test(form.phone.replace(/\D/g, '').slice(0, 11))) {
        return 'Enter a valid mobile number (09XXXXXXXXX).';
      }
      if (form.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email.trim())) {
          return 'Please enter a valid email address.';
        }
      }
      const passwordValidation = validatePasswordStrength(form.password);
      if (!passwordValidation.ok) {
        return passwordValidation.message;
      }
      if (form.password !== form.confirmPassword) {
        return 'Passwords do not match.';
      }
    }

    if (currentStep === 4) {
      if (!form.confirmAccurate) {
        return 'Please confirm that your information is accurate.';
      }
      if (!form.acceptedTerms) {
        return 'Please read and accept the Terms and Conditions before creating an account.';
      }
    }

    return '';
  };

  const goNext = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const goBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const message = validateStep(4);
    if (message) {
      setError(message);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const session = await authApi.register({
        role: 'provider',
        junkshopName: form.junkshopName.trim(),
        address: form.address.trim(),
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.replace(/\D/g, '').slice(0, 11),
        email: form.email.trim() || undefined,
        password: form.password,
        location: form.location,
        operatingHours: sanitizeOperatingHours(form.operatingHours),
        termsAccepted: true,
        termsVersion: TERMS_VERSION,
      });

      if (session.requiresAccountVerification || session.requiresEmailVerification || session.requiresPhoneVerification) {
        setVerificationData({
          email: session.email || form.email.trim().toLowerCase(),
          phone: session.phone || form.phone.replace(/\D/g, '').slice(0, 11),
          role: 'provider',
          requiresEmail: Boolean(session.requiresEmailVerification),
          requiresPhone: Boolean(session.requiresPhoneVerification),
          message: session.message || 'Check your email/SMS for verification codes.',
          devEmailCode: session.devEmailVerificationCode || session.devVerificationCode || '',
          devPhoneCode: session.devPhoneVerificationCode || '',
        });
        return;
      }

      setForm(initialForm);
      setStep(1);
      clearSignUpDrafts();
      onComplete?.(session);
      onClose?.();
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  if (verificationData) {
    return (
      <div
        className={authOverlayClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-verification-title"
        onClick={onClose}
      >
        <div
          className={`${authModalShellClass} max-w-lg`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="scroll-y-clean relative min-h-0 flex-1 p-5 sm:p-6">
            <AuthModalClose onClick={onClose} label="Close verification" />
            <header className="mb-4 pr-10">
              <h2 id="provider-verification-title" className="text-xl font-bold text-charcoal mb-1">
                Verify your account
              </h2>
              <p className="text-charcoal/60 text-sm">
                Enter the codes we sent before opening your junkshop dashboard.
              </p>
            </header>
            <AccountVerificationStep
              email={verificationData.email}
              phone={verificationData.phone}
              role={verificationData.role}
              requiresEmail={verificationData.requiresEmail}
              requiresPhone={verificationData.requiresPhone}
              initialDevEmailCode={verificationData.devEmailCode}
              initialDevPhoneCode={verificationData.devPhoneCode}
              initialMessage={verificationData.message}
              onVerified={(session) => {
                setForm(initialForm);
                setStep(1);
                setVerificationData(null);
                clearSignUpDrafts();
                onComplete?.(session);
                onClose?.();
              }}
              onBack={() => {
                setVerificationData(null);
                setError('');
              }}
              verifyLabel="Verify & continue"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={authOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-signup-title"
      onClick={onClose}
    >
      <div
        className={`${authModalShellClass} max-w-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="scroll-y-clean min-h-0 flex-1 p-5 sm:p-6">
            <AuthModalClose onClick={onClose} label="Close junkshop signup" />

            <header className="mb-2 pr-10">
              <h2 id="provider-signup-title" className="text-xl font-bold text-charcoal mb-1">
                Register your junkshop
              </h2>
              <p className="text-charcoal/60 text-sm">
                Your shop stays hidden from customers until verification is complete.
              </p>
              {onSwitchToCustomer && (
                <button
                  type="button"
                  onClick={onSwitchToCustomer}
                  className="mt-2 text-xs font-semibold text-eco-green hover:text-eco-green/80"
                  disabled={isLoading}
                >
                  Sign up as customer instead
                </button>
              )}
            </header>

            <StepIndicator step={step} />

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="junkshopName" className={authLabelClass}>
                    Business name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="junkshopName"
                    type="text"
                    value={form.junkshopName}
                    onChange={(event) => updateField('junkshopName', event.target.value)}
                    placeholder="Ace Junkshop"
                    className={authInputClass}
                    disabled={isLoading}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/30">
                  <div className="border-b border-emerald-100 bg-white px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-charcoal">
                          Business address <span className="text-red-500">*</span>
                        </p>
                        <p className="mt-0.5 text-xs text-charcoal/60">
                          Search your shop address, then confirm the pin location.
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          form.addressConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {form.addressConfirmed ? (
                          <>
                            <CheckCircle2 size={13} />
                            Confirmed
                          </>
                        ) : (
                          'Needs confirmation'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <LocationPickerMap
                      lat={form.location?.lat}
                      lng={form.location?.lng}
                      onChange={handleLocationChange}
                      className="min-h-[260px]"
                    />

                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-700" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal/50">
                            Selected address
                          </p>
                          <p className="mt-1 text-sm font-medium leading-relaxed text-charcoal">
                            {form.address || 'No address selected yet.'}
                          </p>
                          {form.location?.lat != null && (
                            <p className="mt-1 font-mono text-[11px] text-charcoal/45">
                              {Number(form.location.lat).toFixed(5)}, {Number(form.location.lng).toFixed(5)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={confirmAddress}
                      disabled={isLoading || !canConfirmAddress || form.addressConfirmed}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#154212] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <CheckCircle2 size={16} />
                      {form.addressConfirmed ? 'Address confirmed' : 'Confirm address'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ownerFirstName" className={authLabelClass}>
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="ownerFirstName"
                      type="text"
                      value={form.firstName}
                      onChange={(event) => updateField('firstName', event.target.value)}
                      className={authInputClass}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerLastName" className={authLabelClass}>
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="ownerLastName"
                      type="text"
                      value={form.lastName}
                      onChange={(event) => updateField('lastName', event.target.value)}
                      className={authInputClass}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ownerMiddleName" className={authLabelClass}>
                    Middle name{' '}
                    <span className="text-charcoal/40 font-normal text-xs">(optional)</span>
                  </label>
                  <input
                    id="ownerMiddleName"
                    type="text"
                    value={form.middleName}
                    onChange={(event) => updateField('middleName', event.target.value)}
                    className={authInputClass}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="ownerPhone" className={authLabelClass}>
                    Mobile number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ownerPhone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField('phone', event.target.value.replace(/\D/g, '').slice(0, 11))
                    }
                    placeholder="09XXXXXXXXX"
                    className={authInputClass}
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-charcoal/50">
                    You will log in using this mobile number.
                  </p>
                </div>

                <div>
                  <label htmlFor="ownerEmail" className={authLabelClass}>
                    Email address{' '}
                    <span className="text-charcoal/40 font-normal text-xs">(optional)</span>
                  </label>
                  <input
                    id="ownerEmail"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="owner@email.com"
                    className={authInputClass}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ownerPassword" className={authLabelClass}>
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="ownerPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(event) => updateField('password', event.target.value)}
                          className={authInputWithIconClass}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((open) => !open)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60"
                          disabled={isLoading}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="ownerConfirmPassword" className={authLabelClass}>
                        Confirm password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="ownerConfirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={form.confirmPassword}
                          onChange={(event) => updateField('confirmPassword', event.target.value)}
                          className={authInputWithIconClass}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((open) => !open)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60"
                          disabled={isLoading}
                          aria-label={
                            showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                          }
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
                  <PasswordRequirements password={form.password} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-charcoal/70">Set your weekly shop hours.</p>
                  <button
                    type="button"
                    onClick={() =>
                      updateField('operatingHours', copyWeekdayHours(form.operatingHours, 'mon'))
                    }
                    className="text-xs font-semibold text-eco-green hover:text-eco-green/80"
                    disabled={isLoading}
                  >
                    Copy Mon to weekdays
                  </button>
                </div>

                <div className="space-y-3 md:hidden">
                  {form.operatingHours.map((row, index) => (
                    <div
                      key={row.day}
                      className="rounded-xl border border-gray-200 bg-white p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-charcoal">
                          {WEEKDAY_ROWS.find((item) => item.day === row.day)?.label || row.day}
                        </p>
                        <label className="flex items-center gap-2 text-xs font-semibold text-charcoal/70">
                          <input
                            type="checkbox"
                            checked={row.closed}
                            onChange={(event) => {
                              const next = [...form.operatingHours];
                              next[index] = {
                                ...next[index],
                                closed: event.target.checked,
                                open: event.target.checked ? '' : next[index].open || '08:00',
                                close: event.target.checked ? '' : next[index].close || '17:00',
                              };
                              updateField('operatingHours', next);
                            }}
                            disabled={isLoading}
                          />
                          Closed
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="space-y-1 text-xs font-semibold text-charcoal/70">
                          Open
                          <input
                            type="time"
                            value={row.closed ? '' : row.open}
                            onChange={(event) => {
                              const next = [...form.operatingHours];
                              next[index] = {
                                ...next[index],
                                open: event.target.value,
                                closed: false,
                              };
                              updateField('operatingHours', next);
                            }}
                            disabled={isLoading || row.closed}
                            className="w-full min-h-11 border border-gray-300 px-2 py-1.5 text-sm rounded-lg"
                          />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-charcoal/70">
                          Close
                          <input
                            type="time"
                            value={row.closed ? '' : row.close}
                            onChange={(event) => {
                              const next = [...form.operatingHours];
                              next[index] = {
                                ...next[index],
                                close: event.target.value,
                                closed: false,
                              };
                              updateField('operatingHours', next);
                            }}
                            disabled={isLoading || row.closed}
                            className="w-full min-h-11 border border-gray-300 px-2 py-1.5 text-sm rounded-lg"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block scroll-x-clean border border-gray-200">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="bg-light-gray text-xs uppercase tracking-wide text-charcoal/70">
                      <tr>
                        <th className="px-3 py-2">Day</th>
                        <th className="px-3 py-2">Open</th>
                        <th className="px-3 py-2">Close</th>
                        <th className="px-3 py-2 text-center">Closed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {form.operatingHours.map((row, index) => (
                        <tr key={row.day}>
                          <td className="px-3 py-2 font-semibold text-charcoal">
                            {WEEKDAY_ROWS.find((item) => item.day === row.day)?.label || row.day}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="time"
                              value={row.closed ? '' : row.open}
                              onChange={(event) => {
                                const next = [...form.operatingHours];
                                next[index] = {
                                  ...next[index],
                                  open: event.target.value,
                                  closed: false,
                                };
                                updateField('operatingHours', next);
                              }}
                              disabled={isLoading || row.closed}
                              className="w-full border border-gray-300 px-2 py-1.5 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="time"
                              value={row.closed ? '' : row.close}
                              onChange={(event) => {
                                const next = [...form.operatingHours];
                                next[index] = {
                                  ...next[index],
                                  close: event.target.value,
                                  closed: false,
                                };
                                updateField('operatingHours', next);
                              }}
                              disabled={isLoading || row.closed}
                              className="w-full border border-gray-300 px-2 py-1.5 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.closed}
                              onChange={(event) => {
                                const next = [...form.operatingHours];
                                next[index] = {
                                  ...next[index],
                                  closed: event.target.checked,
                                  open: event.target.checked ? '' : next[index].open || '08:00',
                                  close: event.target.checked ? '' : next[index].close || '17:00',
                                };
                                updateField('operatingHours', next);
                              }}
                              disabled={isLoading}
                              aria-label={`Closed on ${row.day}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="border border-gray-200 bg-light-gray/40 p-4 text-sm space-y-2">
                  <p>
                    <span className="font-semibold text-charcoal">Business:</span>{' '}
                    {form.junkshopName}
                  </p>
                  <p>
                    <span className="font-semibold text-charcoal">Owner:</span>{' '}
                    {[form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')}
                  </p>
                  <p>
                    <span className="font-semibold text-charcoal">Mobile:</span> {form.phone}
                  </p>
                  <p>
                    <span className="font-semibold text-charcoal">Email:</span>{' '}
                    {form.email.trim() || 'Not provided'}
                  </p>
                  <p>
                    <span className="font-semibold text-charcoal">Address:</span> {form.address}
                  </p>
                  <p>
                    <span className="font-semibold text-charcoal">Map pin:</span>{' '}
                    {form.location?.lat != null ? 'Set' : 'Not set yet'}
                  </p>
                  <p>
                    <span className="font-semibold text-charcoal">Hours:</span> {hoursSummary}
                  </p>
                </div>

                <label className="flex items-start gap-3 text-sm text-charcoal/80">
                  <input
                    type="checkbox"
                    checked={form.confirmAccurate}
                    onChange={(event) => updateField('confirmAccurate', event.target.checked)}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <span>I confirm this information is accurate.</span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-charcoal/80">
                  <input
                    type="checkbox"
                    checked={form.acceptedTerms}
                    onChange={(event) => updateField('acceptedTerms', event.target.checked)}
                    disabled={isLoading}
                    className="mt-1"
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

                <p className="text-xs text-charcoal/60">
                  After signup, upload your government ID, business permit, and shop photos in your
                  dashboard to submit for admin verification.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-white p-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={step === 1 ? onShowLogin : goBack}
                className="h-11 px-4 text-sm font-semibold text-charcoal/70 hover:text-charcoal"
                disabled={isLoading}
              >
                {step === 1 ? 'Already have an account?' : '← Back'}
              </button>

              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={isLoading}
                  className={`${authSubmitClass} sm:max-w-48`}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`${authSubmitClass} sm:max-w-52`}
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              )}
            </div>
          </div>
        </div>

        <AuthErrorPopup message={error} onDismiss={() => setError('')} />
      </div>
      <TermsAndConditionsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        role="provider"
      />
    </div>
  );
}
