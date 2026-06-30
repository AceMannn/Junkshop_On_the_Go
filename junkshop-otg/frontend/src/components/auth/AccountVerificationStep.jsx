import { useEffect, useRef, useState } from 'react';
import { authApi } from '../../services/api';
import { authInputClass, authLabelClass, authSubmitClass } from './authModalUi';

const OTP_LENGTH = 6;

function normalizeOtp(value) {
  return String(value || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export default function AccountVerificationStep({
  email = '',
  phone = '',
  role = 'customer',
  requiresEmail = false,
  initialMessage = '',
  onVerified,
  onBack,
  verifyLabel = 'Verify account',
}) {
  const [emailCode, setEmailCode] = useState('');
  // SMS OTP support kept for future use:
  // const [phoneCode, setPhoneCode] = useState(normalizeOtp(initialDevPhoneCode));
  const [info, setInfo] = useState(initialMessage);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    // SMS OTP support kept for future use:
    // if (requiresPhone && phoneCode.length !== OTP_LENGTH) {
    //   setError(`Enter the ${OTP_LENGTH}-digit code from your SMS.`);
    //   return;
    // }
    if (requiresEmail && emailCode.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }

    setIsLoading(true);
    try {
      const session = await authApi.verifyAccount({
        email,
        phone,
        role,
        emailCode,
        // SMS OTP support kept for future use:
        // phoneCode,
      });
      onVerified?.(session);
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setIsResending(true);
    try {
      const data = await authApi.resendAccountVerification({ email, phone, role });
      if (data.devEmailVerificationCode) {
        setEmailCode(normalizeOtp(data.devEmailVerificationCode));
      }
      // SMS OTP support kept for future use:
      // if (data.devPhoneVerificationCode) {
      //   setPhoneCode(normalizeOtp(data.devPhoneVerificationCode));
      // }
      setInfo(data.message || 'A new verification code was sent.');
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setIsResending(false);
    }
  };

  const descriptionText = (() => {
    // SMS OTP support kept for future use:
    // if (requiresPhone && requiresEmail) {
    //   return 'Enter the 6-digit codes we sent to your mobile number and email to activate your account.';
    // }
    // if (requiresPhone) {
    //   return 'Enter the 6-digit code we sent to your mobile number to activate your account.';
    // }
    if (requiresEmail) {
      return 'Enter the 6-digit code we sent to your email to activate your account.';
    }
    return 'Your account will be verified when you continue.';
  })();

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-sm text-charcoal/70">{descriptionText}</p>

      {info && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 break-all">
          {info}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* SMS OTP support kept for future use:
      {requiresPhone && (
        <div>
          <label htmlFor="phone-verification-code" className={authLabelClass}>
            SMS code sent to {phone}
          </label>
          <input
            ref={firstInputRef}
            id="phone-verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={phoneCode}
            onChange={(event) => {
              setPhoneCode(normalizeOtp(event.target.value));
              setError('');
            }}
            placeholder={`${'0'.repeat(OTP_LENGTH)}`}
            className={`${authInputClass} text-center font-semibold tracking-[0.35em]`}
            disabled={isLoading}
          />
        </div>
      )}
      */}

      {requiresEmail && (
        <div>
          <label htmlFor="email-verification-code" className={authLabelClass}>
            Email code sent to {email}
          </label>
          <input
            ref={firstInputRef}
            id="email-verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={emailCode}
            onChange={(event) => {
              setEmailCode(normalizeOtp(event.target.value));
              setError('');
            }}
            placeholder={`${'0'.repeat(OTP_LENGTH)}`}
            className={`${authInputClass} text-center font-semibold tracking-[0.35em]`}
            disabled={isLoading}
          />
        </div>
      )}

      <button type="submit" disabled={isLoading} className={authSubmitClass}>
        {isLoading ? 'Verifying...' : verifyLabel}
      </button>

      <div className="flex flex-col gap-2 text-center text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || isLoading}
          className="font-semibold text-eco-green hover:text-eco-green/80 disabled:opacity-60"
        >
          {isResending ? 'Sending...' : 'Resend code'}
        </button>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-charcoal/60 hover:text-charcoal"
          >
            Back
          </button>
        )}
      </div>
    </form>
  );
}
