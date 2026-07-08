import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  authInputWithIconClass,
  authLabelClass,
  authPasswordToggleButtonClass,
} from './authModalUi';
import PasswordRequirements from './PasswordRequirements';

export default function SignUpPasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmChange,
  disabled = false,
  passwordId = 'signup-password',
  confirmId = 'signup-confirm-password',
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const showGuide = passwordFocused || Boolean(password);
  const showMatchHint = Boolean(confirmPassword);
  const passwordsMatch = password === confirmPassword;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={passwordId} className={authLabelClass}>
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <input
            type={showPassword ? 'text' : 'password'}
            id={passwordId}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            placeholder="Create a strong password"
            className={authInputWithIconClass}
            disabled={disabled}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((open) => !open)}
            className={authPasswordToggleButtonClass}
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {showGuide ? (
        <PasswordRequirements password={password} />
      ) : null}

      <div>
        <label htmlFor={confirmId} className={authLabelClass}>
          Confirm password <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id={confirmId}
            value={confirmPassword}
            onChange={(event) => onConfirmChange(event.target.value)}
            placeholder="Re-enter your password"
            className={authInputWithIconClass}
            disabled={disabled}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((open) => !open)}
            className={authPasswordToggleButtonClass}
            disabled={disabled}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            aria-pressed={showConfirmPassword}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {showMatchHint ? (
          <p
            className={`mt-1.5 text-xs font-medium ${
              passwordsMatch ? 'text-emerald-700' : 'text-red-600'
            }`}
            role="status"
          >
            {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
