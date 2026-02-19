import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react';

export default function LoginScreen({ onCustomerLogin, onProviderLogin, onClose, onShowSignUp }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState('customer');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        // Validate email and password
        if (!email || !password) {
            setError('Please enter both email and password to continue.');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        // Simulate authentication process
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

    const handleSocialLogin = (provider) => {
    setError('');
    // In production, this would redirect to OAuth flow
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
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 relative"
      >
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Role Toggle */}
        <div className="bg-light-gray rounded-lg p-1 mb-4 flex">
          <button
            type="button"
            onClick={() => setSelectedRole('customer')}
            className={`flex-1 py-2 px-3 rounded-md font-medium transition-all text-sm ${
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
            className={`flex-1 py-2 px-3 rounded-md font-medium transition-all text-sm ${
              selectedRole === 'provider'
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-charcoal/60 hover:text-charcoal'
            }`}
          >
            Provider
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block font-medium mb-1.5 text-charcoal text-sm">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="your@email.com"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-all text-charcoal placeholder:text-charcoal/40 text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block font-medium mb-1.5 text-charcoal text-sm">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-all text-charcoal placeholder:text-charcoal/40 text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-eco-green hover:text-eco-green/80 transition-colors font-medium text-xs"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <motion.button
            type="submit"
            whileHover={!isLoading ? { scale: 1.01 } : {}}
            whileTap={!isLoading ? { scale: 0.99 } : {}}
            disabled={isLoading}
            className="w-full py-2.5 bg-eco-green text-white rounded-lg font-semibold shadow-sm hover:bg-eco-green/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Logging in...' : `Log in as ${selectedRole === 'customer' ? 'Customer' : 'Provider'}`}
          </motion.button>

          {/* Quick Access Button - Temporary */}
          <motion.button
            type="button"
            onClick={() => {
              if (selectedRole === 'provider') {
                onProviderLogin();
              } else {
                onCustomerLogin();
              }
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-2.5 bg-clean-blue text-white rounded-lg font-semibold shadow-sm hover:bg-clean-blue/90 transition-all text-sm"
          >
            🚀 Quick Access (No Password)
          </motion.button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-4 text-center">
          <p className="text-charcoal/60 text-sm">
            Don't have an account?{' '}
            <button
              className="text-eco-green hover:text-eco-green/80 font-semibold transition-colors"
              disabled={isLoading}
              onClick={onShowSignUp}
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}