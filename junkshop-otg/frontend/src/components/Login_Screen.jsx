import { motion } from 'motion/react';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Chrome, Facebook } from 'lucide-react';

export function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate login - in real app, this would validate credentials
        onLogin();
    };

    const handleSocialLogin = (provider) => {
        console.log(`Login with ${provider}`);
        // Simulate social login
        onLogin();
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 bg-gradient-to-br from-eco-green/5 via-light-gray to-clean-blue/5">
            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-[400px] bg-white rounded-xl shadow-lg p-6"
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-eco-green rounded-full flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-6 h-6"
                            >
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-charcoal mb-1">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-sm text-charcoal/60">
                        {isSignUp ? 'Sign up to get started' : 'Log in to continue'}
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm mb-1 text-charcoal/70">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-1 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm mb-1 text-charcoal/70">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-1 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-sm"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    {!isSignUp && (
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-eco-green focus:ring-eco-green/20"
                                />
                                <span className="text-xs text-charcoal/60 group-hover:text-charcoal transition-colors">
                                    Remember me
                                </span>
                            </label>
                            <button
                                type="button"
                                className="text-xs text-clean-blue hover:text-clean-blue/80 transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    {/* Login Button */}
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-2.5 bg-eco-green text-white rounded-lg font-medium shadow-sm hover:bg-eco-green/90 transition-colors text-sm"
                    >
                        {isSignUp ? 'Create Account' : 'Log In'}
                    </motion.button>

                    {/* Divider */}
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-2 bg-white text-xs text-charcoal/50">or continue with</span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-2">
                        <motion.button
                            type="button"
                            onClick={() => handleSocialLogin('Google')}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                            <Chrome className="w-4 h-4 text-charcoal/60" />
                            <span className="text-charcoal/70">Google</span>
                        </motion.button>

                        <motion.button
                            type="button"
                            onClick={() => handleSocialLogin('Facebook')}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                            <Facebook className="w-4 h-4 text-charcoal/60" />
                            <span className="text-charcoal/70">Facebook</span>
                        </motion.button>
                    </div>
                </form>

                {/* Sign Up Link */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-charcoal/60">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-clean-blue hover:text-clean-blue/80 font-medium transition-colors"
                        >
                            {isSignUp ? 'Log in' : 'Sign up'}
                        </button>
                    </p>
                </div>

                {/* Quick Demo Access */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onLogin}
                        className="w-full py-2 text-xs text-eco-green border border-eco-green/30 rounded-lg hover:bg-eco-green/5 transition-colors"
                    >
                        Continue as Guest
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
