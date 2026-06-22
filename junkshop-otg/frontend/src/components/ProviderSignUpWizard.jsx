import { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../services/api';
import LocationPickerMap from './maps/LocationPickerMap';
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

const STEPS = [
  { id: 1, title: 'Business info' },
  { id: 2, title: 'Owner account' },
  { id: 3, title: 'Map location' },
  { id: 4, title: 'Operating hours' },
  { id: 5, title: 'Review' },
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
  operatingHours: DEFAULT_OPERATING_HOURS,
  confirmAccurate: false,
};

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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hoursSummary = useMemo(
    () => formatOperatingHoursSummary(form.operatingHours),
    [form.operatingHours]
  );

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!form.junkshopName.trim() || !form.address.trim()) {
        return 'Business name and address are required.';
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
      if (form.password.length < 8) {
        return 'Password must be at least 8 characters long.';
      }
      if (form.password !== form.confirmPassword) {
        return 'Passwords do not match.';
      }
    }

    if (currentStep === 5 && !form.confirmAccurate) {
      return 'Please confirm that your information is accurate.';
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
    const message = validateStep(5);
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
      });

      setForm(initialForm);
      setStep(1);
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
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
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
                <div>
                  <label htmlFor="businessAddress" className={authLabelClass}>
                    Business address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="businessAddress"
                    value={form.address}
                    onChange={(event) => updateField('address', event.target.value)}
                    placeholder="Street, barangay, Teresa, Sta. Mesa"
                    rows={3}
                    className={`${authInputClass} min-h-[88px] resize-none`}
                    disabled={isLoading}
                  />
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
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-charcoal/70">
                  Pin your junkshop on the map so customers can find you later. You can skip this
                  for now and set it in Settings.
                </p>
                <LocationPickerMap
                  lat={form.location?.lat}
                  lng={form.location?.lng}
                  onChange={(next) => updateField('location', next)}
                  className="min-h-[280px]"
                />
                {form.location?.lat != null && (
                  <p className="text-xs text-charcoal/60">
                    Pin set at {Number(form.location.lat).toFixed(5)},{' '}
                    {Number(form.location.lng).toFixed(5)}
                    {form.location.address ? ` · ${form.location.address}` : ''}
                  </p>
                )}
              </div>
            )}

            {step === 4 && (
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

                <div className="overflow-x-auto border border-gray-200">
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

            {step === 5 && (
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
    </div>
  );
}
