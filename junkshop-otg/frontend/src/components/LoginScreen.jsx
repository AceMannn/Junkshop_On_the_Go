import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react';

export default function LoginScreen({ onCustomerLogin, onProviderLogin, onClose, onShowSignUp }) {
  /* ==========================
     STATE MANAGEMENT
     ========================== */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /* ==========================
     LOGIN VALIDATION + TEMP LOGIN LOGIC
     ========================== */
  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password to continue.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (selectedRole === 'provider') {
        onProviderLogin();
      } else {
        onCustomerLogin();
      }
    }, 1000);
  };

  return (
    /* ==========================
       LOGIN MODAL BACKGROUND OVERLAY
       Controls: screen overlay color, modal position, centering
       ========================== */
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-charcoal/50">

      {/* ==========================
          LOGIN MODAL CARD
          Controls: modal width, height feel, padding, shadow, border radius
          Adjust here:
          - max-w-sm = modal width
          - p-6 = inside spacing
          ========================== */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-4 relative">

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-3 h-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* ==========================
            MODAL HEADER / BRANDING
            Controls: logo text, title, subtitle, top spacing
            Adjust mb-5 to reduce/increase header space
            ========================== */}
        <div className="text-center mb-3">
          <h1 className="text-xl font-bold text-charcoal mb-0.5">
            Welcome Back
          </h1>

          <p className="text-charcoal/60 text-sm">
            Login to continue using JunkShop On-The-Go
          </p>
        </div>

        {/* ==========================
            ROLE TOGGLE
            Controls: Customer / Provider switch
            Adjust h-8 for height, mb-5 for spacing below
            ========================== */}
        <div className="bg-light-gray rounded-lg p-0.5 h-12 mb-2 mt-2 flex">
          <button
            type="button"
            onClick={() => setSelectedRole('customer')}
            className={`flex-1 rounded-md font-medium transition-colors text-sm ${
              selectedRole === 'customer'
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-charcoal/60 hover:text-charcoal'
            }`}
          >
            Customer
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('provider')}
            className={`flex-1 rounded-md font-medium transition-colors text-sm ${
              selectedRole === 'provider'
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-charcoal/60 hover:text-charcoal'
            }`}
          >
            Provider
          </button>
        </div>

        {/* ==========================
            ERROR MESSAGE
            Shows when validation fails
            ========================== */}
        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* ==========================
            LOGIN FORM
            Controls spacing between form sections
            Adjust space-y-3 to make form shorter/taller
            ========================== */}
        <form onSubmit={handleLogin} className="space-y-2">

          {/* Email Input Field */}
          <div>
            <label htmlFor="email" className="block font-medium mb-1.5 text-charcoal text-sm">
              Email address
            </label>

            <div className="relative">
              <Mail className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />

              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="your@email.com"
                className="w-full pl-12 pr-6 py-2.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input Field */}
          <div>
            <label htmlFor="password" className="block font-medium  text-charcoal text-sm">
              Password
            </label>

            <div className="relative">
              <Lock className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />

              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="w-full pl-12 pr-11 py-2.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-sm"
                disabled={isLoading}
              />

              {/* Show / Hide Password Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-eco-green hover:text-eco-green/80 transition-colors font-medium text-xs"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          {/* Main Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-eco-green text-white rounded-lg font-semibold shadow-sm hover:bg-eco-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isLoading
              ? 'Logging in...'
              : `Log in as ${selectedRole === 'customer' ? 'Customer' : 'Provider'}`}
          </button>

          {/* Temporary Quick Access Button */}
          <button
            type="button"
            onClick={() => {
              if (selectedRole === 'provider') {
                onProviderLogin();
              } else {
                onCustomerLogin();
              }
            }}
            className="w-full py-1 bg-clean-blue text-white rounded-lg font-semibold shadow-sm hover:bg-clean-blue/90 transition-colors text-sm"
          >
            Quick Access
          </button>

          {/* Divider Between Normal Login and Google Login */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] font-bold tracking-widest text-charcoal/50">
              OR CONTINUE WITH
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            className="w-full py-2.5 border border-gray-200 bg-white text-charcoal rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <span className="text-lg font-bold text-blue-500">G</span>
            Google
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-2 text-center">
          <p className="text-charcoal/60 text-sm leading-tight">
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
      </div>
    </div>
  );
}