import { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImage from '../assets/junkshop-logo.png';
import { AccountPanel } from './AccountPanel';

export default function Header({ activeSection, onNavigate, onLogout, isAuthenticated = false, onShowLogin, onShowSignUp }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'prices', label: 'Prices' },
        { id: 'guide', label: 'Recycling Guide' },
        { id: 'find', label: 'Find Junkshop' },
        { id: 'about', label: 'About' },
        { id: 'contact', label: 'Contact' },
    ];

    const handleAccountClick = () => {
        setIsAccountPanelOpen(true);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <motion.header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/95'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px- lg:px-0">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center cursor-pointer"
                            onClick={() => onNavigate('home')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <img
                                src={logoImage}
                                alt="JunkShop On-The-Go"
                                className="h-15 w-auto"
                            />
                        </motion.div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-8">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.id}
                                    label={item.label}
                                    isActive={activeSection === item.id}
                                    onClick={() => onNavigate(item.id)}
                                />
                            ))}
                        </nav>

                        {/* Desktop Actions */}
                        <div className="hidden lg:flex items-center gap-3">
                            {/* Account Button (only when authenticated) */}
                            {isAuthenticated && (
                                <motion.button
                                    onClick={handleAccountClick}
                                    className="p-2.5 text-charcoal hover:bg-eco-green/10 hover:text-eco-green rounded-lg transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Account"
                                >
                                    <User size={24} />
                                </motion.button>
                            )}

                            {/* Login Button (only when not authenticated) */}
                            {!isAuthenticated && onShowLogin && (
                                <motion.button
                                    onClick={onShowLogin}
                                    className="px-6 py-3 text-charcoal hover:bg-light-gray rounded-[12px] transition-colors"
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                >
                                    Login
                                </motion.button>
                            )}

                            {/* Sign Up Button */}
                            {!isAuthenticated && onShowSignUp && (
                                <motion.button
                                    className="bg-eco-green text-white px-6 py-3 rounded-[12px] hover:bg-[#358F52] transition-colors shadow-md"
                                    onClick={onShowSignUp}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                >
                                    Sign Up
                                </motion.button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden p-2 text-charcoal"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="lg:hidden bg-white border-t border-light-gray"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <nav className="px-4 py-4 space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${activeSection === item.id
                                                ? 'bg-eco-green text-white'
                                                : 'hover:bg-light-gray text-charcoal'
                                            }`}
                                        onClick={() => {
                                            onNavigate(item.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                ))}

                                {/* Account Menu Item (only when authenticated) */}
                                {isAuthenticated && (
                                    <button
                                        className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-colors hover:bg-light-gray text-charcoal border-t border-gray-200 mt-2 pt-4"
                                        onClick={handleAccountClick}
                                    >
                                        <User size={20} />
                                        <span>Account</span>
                                    </button>
                                )}

                                {/* Login Menu Item (only when not authenticated) */}
                                {!isAuthenticated && onShowLogin && (
                                    <button
                                        className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-colors hover:bg-light-gray text-charcoal border-t border-gray-200 mt-2 pt-4"
                                        onClick={() => {
                                            onShowLogin();
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        <span>Login</span>
                                    </button>
                                )}

                                {/* Sign Up Button (only when not authenticated) */}
                                {!isAuthenticated && onShowSignUp && (
                                    <button
                                        className="w-full bg-eco-green text-white px-6 py-3 rounded-[12px] mt-4"
                                        onClick={() => {
                                            onShowSignUp();
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                )}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* Account Panel - Overlay */}
            <AccountPanel
                isOpen={isAccountPanelOpen}
                onClose={() => setIsAccountPanelOpen(false)}
                onLogout={onLogout}
                role="customer"
            />
        </>
    );
}

function NavLink({ label, isActive, onClick }) {
    return (
        <motion.button
            className="relative text-charcoal hover:text-eco-green transition-colors py-2"
            onClick={onClick}
            whileHover={{ y: -2 }}
        >
            {label}
            {isActive && (
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-eco-green"
                    layoutId="activeNav"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}
        </motion.button>
    );
}
