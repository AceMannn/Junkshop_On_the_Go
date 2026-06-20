import { useState, useEffect } from 'react';
import { Menu, X, User, LogIn } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import logoImage from '../assets/junkshop-logo.png';
import { AccountPanel } from './AccountPanel';

/* ==========================
   HEADER COMPONENT - MAIN PROGRAM GROUP
   ========================== */
export default function Header({
    activeSection,
    onNavigate,
    onLogout,
    isAuthenticated = false,
    onShowLogin,
    onShowSignUp,
}) {
    // Mobile menu toggle
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Account panel overlay toggle
    const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);

    // ==========================
    // SCROLL HIDE/REVEAL LOGIC
    // ==========================
    const [lastScrollY, setLastScrollY] = useState(0);
    const [headerVisible, setHeaderVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show header if scrolling up, hide if scrolling down
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setHeaderVisible(false); // scrolling down
            } else {
                setHeaderVisible(true); // scrolling up
            }

            setLastScrollY(currentScrollY);

        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Navigation items
    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'about', label: 'About Us' },
        { id: 'contact', label: 'Contact' },
    ];

    // Handle opening the account panel
    const handleAccountClick = () => {
        setIsAccountPanelOpen(true);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* ==========================
                HEADER BAR - ANIMATED WITH SCROLL HIDE/REVEAL
                ========================== */}
            <Motion.header
                className="fixed top-0 left-0 right-0 z-50 bg-white/30 backdrop-blur-md transition-all duration-300"
                initial={{ y: -100 }}
                animate={{ y: headerVisible ? 0 : -120 }} // smart hide/reveal
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">

                        {/* Logo Section */}
                        <Motion.div
                            className="flex items-center cursor-pointer"
                            onClick={() => onNavigate('home')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <img
                                src={logoImage}
                                alt="JunkShop On-The-Go"
                                className="h-10 sm:h-12 w-auto max-w-[10rem] sm:max-w-none"
                            />
                        </Motion.div>

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

                        {/* Desktop Action Buttons */}
                        <div className="hidden lg:flex items-center gap-3">
                            {isAuthenticated && (
                                <Motion.button
                                    onClick={handleAccountClick}
                                    className="p-2.5 text-charcoal hover:bg-eco-green/10 hover:text-eco-green rounded-lg transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Account"
                                >
                                    <User size={24} />
                                </Motion.button>
                            )}
                            {!isAuthenticated && onShowLogin && (
                                <Motion.button
                                    onClick={onShowLogin}
                                    className="flex items-center gap-2 px-4 py-2.5 text-charcoal rounded-full hover:bg-eco-green/10 hover:text-eco-green transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Login
                                    <LogIn size={18} />
                                </Motion.button>
                            )}
                            {!isAuthenticated && onShowSignUp && (
                                <Motion.button
                                    onClick={onShowSignUp}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-eco-green text-white rounded-full hover:bg-[#358F52] transition-all shadow-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Sign Up
                                    <User size={18} />
                                </Motion.button>
                            )}
                        </div>

                        {/* Mobile Menu Toggle Button */}
                        <button
                            className="lg:hidden p-2 text-charcoal"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle navigation menu"
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* ==========================
                    MOBILE MENU PANEL
                    ========================== */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <Motion.div
                            className="lg:hidden bg-white border-t border-light-gray"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <nav className="px-4 py-4 space-y-2">
                                {navItems.map((item) => {
                                    const isActive = activeSection === item.id;
                                    return (
                                    <button
                                        key={item.id}
                                        className={`block w-full text-left px-4 py-3 rounded-lg transition-colors border-l-4 ${
                                            isActive
                                                ? 'border-eco-green text-eco-green font-semibold bg-eco-green/5'
                                                : 'border-transparent hover:bg-light-gray text-charcoal'
                                        }`}
                                        onClick={() => {
                                            onNavigate(item.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                    );
                                })}
                                {isAuthenticated && (
                                    <button
                                        className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-colors hover:bg-light-gray text-charcoal border-t border-gray-200 mt-2 pt-4"
                                        onClick={handleAccountClick}
                                    >
                                        <User size={20} />
                                        <span>Account</span>
                                    </button>
                                )}
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
                        </Motion.div>
                    )}
                </AnimatePresence>
            </Motion.header>

            {/* ==========================
                ACCOUNT PANEL OVERLAY
                ========================== */}
            <AccountPanel
                isOpen={isAccountPanelOpen}
                onClose={() => setIsAccountPanelOpen(false)}
                onLogout={onLogout}
                role="customer"
            />
        </>
    );
}

/* ==========================
   NAVLINK COMPONENT - SMALL COMPONENT
   ========================== */
function NavLink({ label, isActive, onClick }) {
    return (
        <button
            className="relative text-charcoal hover:text-eco-green transition-colors py-2"
            onClick={onClick}
        >
            {label}
            <span
                className={`absolute bottom-0 left-0 h-0.5 bg-eco-green transition-all duration-300 ${isActive ? 'w-full' : 'w-0'
                    }`}
            />
        </button>
    );
}