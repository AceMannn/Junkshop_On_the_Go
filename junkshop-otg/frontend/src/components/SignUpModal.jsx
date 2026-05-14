import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X, User, MapPin, Phone } from 'lucide-react';

export default function SignUpModal({ isOpen, onClose, onSignUpSuccess, onShowLogin }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
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

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.fullName || !formData.email || !formData.password) {
            setError('Please fill in all required fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (formData.phone && formData.phone.length < 10) {
            setError('Please enter a valid phone number.');
            return;
        }

        if (selectedRole === 'provider' && !formData.address) {
            setError('Please enter your junkshop address.');
            return;
        }

        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);

            setFormData({
                fullName: '',
                email: '',
                phone: '',
                address: '',
                password: '',
                confirmPassword: '',
            });

            if (onSignUpSuccess) {
                onSignUpSuccess();
            }

            onClose();
        }, 1500);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-charcoal/50 z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
                <div
                    className="w-full max-w-lg bg-white rounded-2xl shadow-2xl pointer-events-auto my-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative p-4 sm:p-5">
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-3 right-3 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm z-10"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Header */}
                        <div className="mb-3">
                            <h2 className="text-charcoal mb-0.5 text-lg">Create Account</h2>
                            <p className="text-charcoal/60 text-xs">Join JunkShop On-The-Go community</p>
                        </div>

                        {/* Role Toggle */}
                        <div className="bg-light-gray rounded-lg p-1 mb-3 flex">
                            <button
                                type="button"
                                onClick={() => setSelectedRole('customer')}
                                className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors text-xs ${selectedRole === 'customer'
                                        ? 'bg-white text-charcoal shadow-sm'
                                        : 'text-charcoal/60 hover:text-charcoal'
                                    }`}
                            >
                                Customer
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedRole('provider')}
                                className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors text-xs ${selectedRole === 'provider'
                                        ? 'bg-white text-charcoal shadow-sm'
                                        : 'text-charcoal/60 hover:text-charcoal'
                                    }`}
                            >
                                Provider
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-2.5 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Sign Up Form */}
                        <form onSubmit={handleSubmit} className="space-y-2.5">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullName" className="block font-medium mb-1 text-charcoal text-xs">
                                    Full Name <span className="text-red-500">*</span>
                                </label>

                                <div className="relative">
                                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/40" />

                                    <input
                                        type="text"
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                                        placeholder="Juan Dela Cruz"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block font-medium mb-1 text-charcoal text-xs">
                                    Email address <span className="text-red-500">*</span>
                                </label>

                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/40" />

                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phone" className="block font-medium mb-1 text-charcoal text-xs">
                                    Phone Number {selectedRole === 'provider' && <span className="text-red-500">*</span>}
                                </label>

                                <div className="relative">
                                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/40" />

                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="+63 912 345 6789"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Address - Provider Only */}
                            {selectedRole === 'provider' && (
                                <div>
                                    <label htmlFor="address" className="block font-medium mb-1 text-charcoal text-xs">
                                        Junkshop Address <span className="text-red-500">*</span>
                                    </label>

                                    <div className="relative">
                                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/40" />

                                        <input
                                            type="text"
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            placeholder="Teresa, Sta. Mesa, Manila"
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label htmlFor="password" className="block font-medium mb-1 text-charcoal text-xs">
                                        Password <span className="text-red-500">*</span>
                                    </label>

                                    <div className="relative">
                                        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/40" />

                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"
                                            disabled={isLoading}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60 transition-colors"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block font-medium mb-1 text-charcoal text-xs">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>

                                    <div className="relative">
                                        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/40" />

                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"
                                            disabled={isLoading}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60 transition-colors"
                                            disabled={isLoading}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sign Up Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2 bg-eco-green text-white rounded-lg font-semibold shadow-sm hover:bg-eco-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1 text-xs"
                            >
                                {isLoading
                                    ? 'Creating Account...'
                                    : `Sign up as ${selectedRole === 'customer' ? 'Customer' : 'Provider'}`}
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="mt-3 text-center">
                            <p className="text-charcoal/60 text-xs">
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
                    </div>
                </div>
            </div>
        </>
    );
}