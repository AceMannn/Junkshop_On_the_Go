import { useState, useEffect } from 'react';

import { Eye, EyeOff, AlertCircle, CheckCircle, X } from 'lucide-react';

import { authApi } from '../services/api';



export default function LoginScreen({

  onLoginSuccess,

  onClose,

  onShowSignUp,

  initialEmail = '',

  initialRole = 'customer',

  successMessage = '',

}) {

  const [view, setView] = useState('login');

  const [email, setEmail] = useState(initialEmail);

  const [password, setPassword] = useState('');

  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [selectedRole, setSelectedRole] = useState(initialRole);

  const [error, setError] = useState('');

  const [info, setInfo] = useState('');

  const [isLoading, setIsLoading] = useState(false);



  useEffect(() => {

    setEmail(initialEmail);

    setSelectedRole(initialRole);

    setPassword('');

    setResetToken('');

    setNewPassword('');

    setError('');

    setInfo('');

    setView('login');

  }, [initialEmail, initialRole, successMessage]);



  const handleLogin = async (e) => {

    e.preventDefault();

    setError('');

    setInfo('');



    if (!email || !password) {

      setError('Please enter both email and password to continue.');

      return;

    }



    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    if (!emailRegex.test(email)) {

      setError('Please enter a valid email address.');

      return;

    }



    if (password.length < 8) {

      setError('Password must be at least 8 characters long.');

      return;

    }



    setIsLoading(true);



    try {

      const session = await authApi.login({

        email,

        password,

        role: selectedRole,

      });

      onLoginSuccess(session);

    } catch (loginError) {

      setError(loginError.message);

    } finally {

      setIsLoading(false);

    }

  };



  const handleForgotPassword = async (e) => {

    e.preventDefault();

    setError('');

    setInfo('');



    if (!email) {

      setError('Enter your account email.');

      return;

    }



    setIsLoading(true);



    try {

      const data = await authApi.forgotPassword({ email });

      setInfo(
        data.message || 'If that email is registered, a reset code was generated.'
      );

      if (import.meta.env.DEV && data.resetToken) {
        setResetToken(data.resetToken);
        setInfo(
          `${data.message || 'Reset code generated.'} Dev code: ${data.resetToken}`
        );
      }

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



    if (!email || !resetToken || !newPassword) {

      setError('Email, reset code, and new password are required.');

      return;

    }



    if (newPassword.length < 8) {

      setError('New password must be at least 8 characters.');

      return;

    }



    setIsLoading(true);



    try {

      const data = await authApi.resetPassword({

        email,

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

  };



  const subtitles = {

    login: 'Login to continue using JunkShop On-The-Go',

    forgot: 'Enter your email to receive a reset code',

    reset: 'Enter your reset code and choose a new password',

  };



  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-charcoal/50 py-6 sm:py-10"

      role="dialog"

      aria-modal="true"

      aria-labelledby="login-title"

    >

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-4 relative max-h-[90vh] overflow-y-auto">

        {onClose && (

          <button

            type="button"

            onClick={onClose}

            className="absolute top-3 right-3 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-light-gray text-charcoal transition-colors hover:bg-red-600 hover:text-white"

            aria-label="Close login"

          >

            <X className="w-5 h-5" />

          </button>

        )}



        <div className="text-center mb-2">

          <h1 id="login-title" className="text-lg font-bold text-charcoal mb-0.5">

            {titles[view]}

          </h1>

          <p className="text-charcoal/60 text-xs leading-snug">

            {subtitles[view]}

          </p>

        </div>



        {view === 'login' && (

          <div>

            <div className="bg-light-gray rounded-lg p-0.5 h-10 mb-1 mt-1 flex">

              <button

                type="button"

                onClick={() => setSelectedRole('customer')}

                className={`flex-1 rounded-md font-medium transition-colors text-xs py-1 ${selectedRole === 'customer'

                  ? 'bg-white text-charcoal shadow-sm'

                  : 'text-charcoal/60 hover:text-charcoal'

                  }`}

              >

                Customer

              </button>

              <button

                type="button"

                onClick={() => setSelectedRole('provider')}

                className={`flex-1 rounded-md font-medium transition-colors text-xs py-1 ${selectedRole === 'provider'

                  ? 'bg-white text-charcoal shadow-sm'

                  : 'text-charcoal/60 hover:text-charcoal'

                  }`}

              >

                Provider

              </button>

            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 px-1 mt-1 mb-1">

              <span className="text-[10px] text-charcoal/50">

                Customer&nbsp;&mdash;&nbsp;Access recycling tools

              </span>

              <span className="text-[10px] text-charcoal/50 sm:text-right">

                Provider&nbsp;&mdash;&nbsp;Manage junkshop operations

              </span>

            </div>

          </div>

        )}



        {successMessage && view === 'login' && (

          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">

            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />

            <p className="text-xs text-green-700">{successMessage}</p>

          </div>

        )}



        {info && (

          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">

            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />

            <p className="text-xs text-green-700 break-all">{info}</p>

          </div>

        )}



        {error && (

          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">

            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />

            <p className="text-xs text-red-700">{error}</p>

          </div>

        )}



        {view === 'login' && (

          <form onSubmit={handleLogin} className="space-y-1.5">

            <div>

              <label htmlFor="email" className="block font-medium mb-1 text-charcoal text-xs">

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

                className="w-full pl-2 pr-4 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                disabled={isLoading}

              />

            </div>



            <div>

              <label htmlFor="password" className="block font-medium text-charcoal text-xs">

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

                  className="w-full pl-2 pr-9 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                  disabled={isLoading}

                />

                <button

                  type="button"

                  onClick={() => setShowPassword(!showPassword)}

                  className="absolute right-1 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60 transition-colors p-0.5"

                  disabled={isLoading}

                  aria-label={showPassword ? 'Hide password' : 'Show password'}

                  aria-pressed={showPassword}

                >

                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}

                </button>

              </div>

            </div>



            <div className="flex justify-end mt-0.5">

              <button

                type="button"

                onClick={() => {

                  setView('forgot');

                  setError('');

                  setInfo('');

                }}

                className="text-eco-green hover:text-eco-green/80 transition-colors font-medium text-xs"

                disabled={isLoading}

              >

                Forgot password?

              </button>

            </div>



            <div className="flex justify-center">

              <button

                type="submit"

                disabled={isLoading}

                className="px-6 mt-3 py-1.5 bg-eco-green text-white rounded-lg font-semibold shadow-sm hover:bg-eco-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-xs mx-auto block"

              >

                {isLoading

                  ? 'Logging in...'

                  : `Log in as ${selectedRole === 'customer' ? 'Customer' : 'Provider'}`}

              </button>

            </div>



            <div className="mt-1 text-[11px] text-charcoal/50 text-center">

              Your account is protected securely.

            </div>

          </form>

        )}



        {view === 'forgot' && (

          <form onSubmit={handleForgotPassword} className="space-y-1.5">

            <div>

              <label htmlFor="forgot-email" className="block font-medium mb-1 text-charcoal text-xs">

                Email address

              </label>

              <input

                type="email"

                id="forgot-email"

                value={email}

                onChange={(e) => {

                  setEmail(e.target.value);

                  setError('');

                }}

                placeholder="your@email.com"

                className="w-full pl-2 pr-4 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                disabled={isLoading}

              />

            </div>



            <div className="flex justify-center">

              <button

                type="submit"

                disabled={isLoading}

                className="px-6 mt-3 py-1.5 bg-eco-green text-white rounded-lg font-semibold shadow-sm hover:bg-eco-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-xs mx-auto block"

              >

                {isLoading ? 'Sending...' : 'Get reset code'}

              </button>

            </div>



            {resetToken && (

              <div className="flex justify-center mt-2">

                <button

                  type="button"

                  onClick={() => {

                    setView('reset');

                    setError('');

                  }}

                  className="text-eco-green hover:text-eco-green/80 font-semibold text-xs"

                >

                  Enter reset code →

                </button>

              </div>

            )}



            <div className="flex justify-center mt-2">

              <button

                type="button"

                onClick={() => {

                  setView('login');

                  setError('');

                  setInfo('');

                }}

                className="text-charcoal/60 hover:text-charcoal text-xs"

              >

                Back to login

              </button>

            </div>

          </form>

        )}



        {view === 'reset' && (

          <form onSubmit={handleResetPassword} className="space-y-1.5">

            <div>

              <label htmlFor="reset-email" className="block font-medium mb-1 text-charcoal text-xs">

                Email address

              </label>

              <input

                type="email"

                id="reset-email"

                value={email}

                onChange={(e) => {

                  setEmail(e.target.value);

                  setError('');

                }}

                placeholder="your@email.com"

                className="w-full pl-2 pr-4 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                disabled={isLoading}

              />

            </div>



            <div>

              <label htmlFor="reset-token" className="block font-medium mb-1 text-charcoal text-xs">

                Reset code

              </label>

              <input

                type="text"

                id="reset-token"

                value={resetToken}

                onChange={(e) => {

                  setResetToken(e.target.value);

                  setError('');

                }}

                placeholder="Paste reset code"

                className="w-full pl-2 pr-4 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                disabled={isLoading}

              />

            </div>



            <div>

              <label htmlFor="new-password" className="block font-medium text-charcoal text-xs">

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

                  className="w-full pl-2 pr-9 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                  disabled={isLoading}

                />

                <button

                  type="button"

                  onClick={() => setShowNewPassword(!showNewPassword)}

                  className="absolute right-1 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60 transition-colors p-0.5"

                  disabled={isLoading}

                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}

                  aria-pressed={showNewPassword}

                >

                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}

                </button>

              </div>

            </div>



            <div className="flex justify-center">

              <button

                type="submit"

                disabled={isLoading}

                className="px-6 mt-3 py-1.5 bg-eco-green text-white rounded-lg font-semibold shadow-sm hover:bg-eco-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-xs mx-auto block"

              >

                {isLoading ? 'Resetting...' : 'Reset password'}

              </button>

            </div>



            <div className="flex justify-center mt-2">

              <button

                type="button"

                onClick={() => {

                  setView('login');

                  setError('');

                  setInfo('');

                }}

                className="text-charcoal/60 hover:text-charcoal text-xs"

              >

                Back to login

              </button>

            </div>

          </form>

        )}



        {view === 'login' && (

          <div className="mt-1 text-center">

            <p className="text-charcoal/60 text-xs leading-tight">

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

          </div>

        )}

      </div>

    </div>

  );

}

