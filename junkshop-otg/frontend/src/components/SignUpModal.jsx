import { useState } from 'react';

import { Eye, EyeOff, AlertCircle, X } from 'lucide-react';

import { authApi } from '../services/api';



export default function SignUpModal({ isOpen, onClose, onSignUpComplete, onShowLogin }) {

    const [formData, setFormData] = useState({

        firstName: '',

        middleName: '',

        lastName: '',

        email: '',

        password: '',

        confirmPassword: '',

        agreedToTerms: false,

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



        if (!formData.agreedToTerms) {

            setError('Please agree to the Terms and Privacy Policy.');

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

                agreedToTerms: false,

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

        <>

            <div

                className="fixed inset-0 bg-charcoal/50 z-50"

                onClick={onClose}

            />



            <div

                className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"

                role="dialog"

                aria-modal="true"

                aria-labelledby="signup-title"

            >

                <div

                    className="w-full max-w-lg bg-white rounded-2xl shadow-2xl pointer-events-auto my-4 max-h-[90vh] overflow-y-auto"

                    onClick={(e) => e.stopPropagation()}

                >

                    <div className="relative p-4 sm:p-5">

                        <button

                            type="button"

                            onClick={onClose}

                            className="absolute top-3 right-3 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-light-gray text-charcoal transition-colors hover:bg-red-600 hover:text-white"

                            aria-label="Close sign up"

                        >

                            <X className="w-5 h-5" />

                        </button>



                        <div className="mb-3">

                            <h2 id="signup-title" className="text-charcoal mb-0.5 text-lg">Create Account</h2>

                            <p className="text-charcoal/60 text-xs">Join JunkShop On-The-Go community</p>

                        </div>



                        <div className="bg-light-gray rounded-lg p-1 mb-1.5 flex">

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



                        <p className="text-[11px] text-charcoal/50 text-center mb-3">

                            {selectedRole === 'customer'

                                ? 'Customer — Access recycling tools'

                                : 'Provider — Manage junkshop operations'}

                        </p>



                        <p className="text-[11px] text-charcoal/60 mb-3 leading-relaxed">

                            {selectedRole === 'customer'

                                ? 'Phone and recovery details can be added later in Settings (like Facebook).'

                                : 'Shop name, address, GCash, and materials are set up in Settings after signup — required before you appear on the map.'}

                        </p>



                        {error && (

                            <div className="mb-2.5 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">

                                <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />

                                <p className="text-xs text-red-700">{error}</p>

                            </div>

                        )}



                        <form onSubmit={handleSubmit} className="space-y-1.5">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">

                                <div className="relative">

                                    <label htmlFor="firstName" className="block font-medium mb-0.5 text-charcoal text-xs">

                                        First Name <span className="text-red-500">*</span>

                                    </label>

                                    <input

                                        type="text"

                                        id="firstName"

                                        value={formData.firstName}

                                        onChange={(e) => handleInputChange('firstName', e.target.value)}

                                        placeholder="Juan"

                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                                        disabled={isLoading}

                                    />

                                </div>

                                <div className="relative">

                                    <label htmlFor="middleName" className="block font-medium mb-0.5 text-charcoal text-xs">

                                        Middle Name <span className="text-charcoal/40 font-normal">(optional)</span>

                                    </label>

                                    <input

                                        type="text"

                                        id="middleName"

                                        value={formData.middleName}

                                        onChange={(e) => handleInputChange('middleName', e.target.value)}

                                        placeholder="Optional"

                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                                        disabled={isLoading}

                                    />

                                </div>

                                <div className="relative">

                                    <label htmlFor="lastName" className="block font-medium mb-0.5 text-charcoal text-xs">

                                        Last Name <span className="text-red-500">*</span>

                                    </label>

                                    <input

                                        type="text"

                                        id="lastName"

                                        value={formData.lastName}

                                        onChange={(e) => handleInputChange('lastName', e.target.value)}

                                        placeholder="Dela Cruz"

                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                                        disabled={isLoading}

                                    />

                                </div>

                            </div>



                            <div>

                                <label htmlFor="email" className="block font-medium mb-0.5 text-charcoal text-xs">

                                    Email address <span className="text-red-500">*</span>

                                </label>

                                <input

                                    type="email"

                                    id="email"

                                    value={formData.email}

                                    onChange={(e) => handleInputChange('email', e.target.value)}

                                    placeholder="your@email.com"

                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                                    disabled={isLoading}

                                />

                            </div>



                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">

                                <div>

                                    <label htmlFor="password" className="block font-medium mb-0.5 text-charcoal text-xs">

                                        Password <span className="text-red-500">*</span>

                                    </label>

                                    <div className="relative">

                                        <input

                                            type={showPassword ? 'text' : 'password'}

                                            id="password"

                                            value={formData.password}

                                            onChange={(e) => handleInputChange('password', e.target.value)}

                                            placeholder="••••••••"

                                            className="w-full pl-2 pr-8 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                                            disabled={isLoading}

                                        />

                                        <button

                                            type="button"

                                            onClick={() => setShowPassword(!showPassword)}

                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60 transition-colors"

                                            disabled={isLoading}

                                            aria-label={showPassword ? 'Hide password' : 'Show password'}

                                            aria-pressed={showPassword}

                                        >

                                            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}

                                        </button>

                                    </div>

                                    <span className="block mt-0.5 text-xs text-charcoal/50">Minimum 8 characters</span>

                                </div>



                                <div>

                                    <label htmlFor="confirmPassword" className="block font-medium mb-0.5 text-charcoal text-xs">

                                        Confirm Password <span className="text-red-500">*</span>

                                    </label>

                                    <div className="relative">

                                        <input

                                            type={showConfirmPassword ? 'text' : 'password'}

                                            id="confirmPassword"

                                            value={formData.confirmPassword}

                                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}

                                            placeholder="••••••••"

                                            className="w-full pl-2 pr-8 py-1.5 border border-gray-300 rounded-lg focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 text-xs"

                                            disabled={isLoading}

                                        />

                                        <button

                                            type="button"

                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}

                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60 transition-colors"

                                            disabled={isLoading}

                                            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}

                                            aria-pressed={showConfirmPassword}

                                        >

                                            {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}

                                        </button>

                                    </div>

                                </div>

                            </div>



                            <div className="flex items-center mt-1 mb-1 space-x-2">

                                <input

                                    type="checkbox"

                                    id="terms"

                                    checked={!!formData.agreedToTerms}

                                    onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}

                                    className="accent-eco-green w-3 h-3 rounded border border-gray-300 focus:ring-eco-green/20"

                                    disabled={isLoading}

                                    style={{ minWidth: '12px', minHeight: '12px' }}

                                />

                                <label htmlFor="terms" className="text-xs text-charcoal cursor-pointer select-none">

                                    I agree to the <span className="underline">Terms</span> and <span className="underline">Privacy Policy</span>

                                </label>

                            </div>



                            <div className="flex justify-center mt-1">

                                <button

                                    type="submit"

                                    disabled={isLoading}

                                    className="px-6 py-2 bg-eco-green text-white rounded-lg font-semibold shadow-sm hover:bg-eco-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-xs"

                                >

                                    {isLoading

                                        ? 'Creating Account...'

                                        : `Sign up as ${selectedRole === 'customer' ? 'Customer' : 'Provider'}`}

                                </button>

                            </div>

                        </form>



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

