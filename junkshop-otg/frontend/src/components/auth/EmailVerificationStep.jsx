import { useEffect, useRef, useState } from 'react';
import { authApi } from '../../services/api';
import { authInputClass, authLabelClass, authSubmitClass } from './authModalUi';

const OTP_LENGTH = 6;

export default function EmailVerificationStep({
  email,
  initialDevCode = '',
  initialMessage = '',
  onVerified,
  onBack,
  verifyLabel = 'Verify email',
}) {
  const [code, setCode] = useState(initialDevCode ? String(initialDevCode).replace(/\D/g, '').slice(0, OTP_LENGTH) : '');
  const [info, setInfo] = useState(initialMessage);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }

    setIsLoading(true);
    try {
      const session = await authApi.verifyEmail({ email, code });
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
      const data = await authApi.resendVerification({ email });
      if (data.devVerificationCode) {
        setCode(String(data.devVerificationCode).replace(/\D/g, '').slice(0, OTP_LENGTH));
        setInfo(`${data.message} Dev code: ${data.devVerificationCode}`);
      } else {
        setInfo(data.message || 'A new code was sent to your email.');
      }
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-sm text-charcoal/70">
        We sent a {OTP_LENGTH}-digit code to <strong>{email}</strong>.
      </p>

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

      <div>
        <label htmlFor="email-verification-code" className={authLabelClass}>
          Verification code
        </label>
        <input
          ref={inputRef}
          id="email-verification-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
            setError('');
          }}
          placeholder={`${'0'.repeat(OTP_LENGTH)}`}
          className={`${authInputClass} tracking-[0.35em] text-center font-semibold`}
          disabled={isLoading}
        />
      </div>

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
