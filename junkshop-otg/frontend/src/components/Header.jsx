import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
//import logoImage from 'figma:asset/c9f53fce1e446cb129eb8ac870625932623f3b5f.png';

export default function Header({ activeSection, onNavigate }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        { id: 'about', label: 'About' },
        { id: 'contact', label: 'Contact' },
    ];

    return (
        <motion.header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/95'
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center cursor-pointer"
                        onClick={() => onNavigate('home')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="h-14 w-40 bg-eco-green rounded-xl flex items-center justify-center text-white font-bold tracking-wide shadow-md">
                            JunkShop
                        </div>

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

                    {/* CTA Button */}
                    <motion.button
                        className="hidden lg:block bg-eco-green text-white px-6 py-3 rounded-[12px] hover:bg-[#358F52] transition-colors shadow-md"
                        onClick={() => onNavigate('find')}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        Find a Junkshop
                    </motion.button>

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
                            <button
                                className="w-full bg-eco-green text-white px-6 py-3 rounded-[12px] mt-4"
                                onClick={() => {
                                    onNavigate('find');
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                Find a Junkshop
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
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
