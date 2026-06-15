import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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

export default function SignUpModal({ isOpen, onClose, onSignUpComplete, onShowLogin }) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.register({
        role: selectedRole,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      const signedUpEmail = formData.email;
      const signedUpRole = selectedRole;

      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      if (onSignUpComplete) {
        onSignUpComplete({ email: signedUpEmail, role: signedUpRole });
      }

      onClose();
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
      aria-labelledby="signup-title"
      onClick={onClose}
    >
      <div
        className={`${authModalShellClass} max-w-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`scroll-y-clean relative min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 ${
            error ? 'overflow-hidden' : ''
          }`}
        >
          <AuthModalClose onClick={onClose} label="Close sign up" />

          <header className="mb-4 pr-10">
            <h2 id="signup-title" className="text-xl font-bold text-charcoal mb-1">
              Create Account
            </h2>
            <p className="text-charcoal/60 text-sm">Join JunkShop On-The-Go community</p>
          </header>

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

          <p className="text-xs text-charcoal/50 mb-4">
            {authRoleHints[selectedRole]}
          </p>

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
                <span className="block mt-1 text-xs text-charcoal/50">Minimum 8 characters</span>
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

            <button type="submit" disabled={isLoading} className={authSubmitClass}>
              {isLoading
                ? 'Creating Account...'
                : `Sign up as ${selectedRole === 'customer' ? 'Customer' : 'Provider'}`}
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
        </div>
        <AuthErrorPopup message={error} onDismiss={() => setError('')} />
      </div>
    </div>
  );
}
