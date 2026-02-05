import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    Settings,
    Bell,
    FileText,
    Package,
    LogOut,
    X,
    Briefcase
} from 'lucide-react';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

export default function AccountPanel({ isOpen, onClose, onLogout, role }) {
    // Close on ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when panel is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const customerMenuItems = [
        { icon: User, label: 'Personal Details', action: 'personal' },
        { icon: Settings, label: 'Account Settings', action: 'settings' },
        { icon: Bell, label: 'Notifications', action: 'notifications' },
    ];

    const providerMenuItems = [
        { icon: User, label: 'Personal Details', action: 'personal' },
        { icon: Settings, label: 'Account Settings', action: 'settings' },
        { icon: Bell, label: 'Notifications', action: 'notifications' },
        { icon: FileText, label: 'Receipts & Billing', action: 'billing' },
        { icon: Package, label: 'Recyclable Management', action: 'recyclables' },
    ];

    const menuItems = role === 'provider' ? providerMenuItems : customerMenuItems;

    const handleMenuClick = (action) => {
        // Here you can add navigation logic or open specific settings
        console.log(`Navigate to: ${action}`);
        // For now, we'll just close the panel
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-[100]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-[101] flex flex-col"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-eco-green to-leaf-green p-6 relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>

                            {/* User Profile */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    {role === 'customer' ? (
                                        <User className="w-8 h-8 text-eco-green" />
                                    ) : (
                                        <Briefcase className="w-8 h-8 text-eco-green" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-lg leading-tight">
                                        {role === 'customer' ? 'Guest User' : 'Provider Name'}
                                    </h3>
                                    <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                                        <Mail className="w-3.5 h-3.5" />
                                        user@example.com
                                    </p>
                                </div>
                            </div>

                            {/* Role Badge */}
                            <div>
                                <span
                                    className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${role === 'customer'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-white/90 text-eco-green'
                                        }`}
                                >
                                    {role === 'customer' ? 'Customer' : 'Provider'}
                                </span>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <nav className="flex-1 p-4 overflow-y-auto">
                            <div className="space-y-1">
                                {menuItems.map((item, index) => (
                                    <motion.button
                                        key={item.action}
                                        onClick={() => handleMenuClick(item.action)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-charcoal hover:bg-eco-green/10 hover:text-eco-green transition-all group"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ x: 4 }}
                                    >
                                        <item.icon className="w-5 h-5 text-charcoal/60 group-hover:text-eco-green transition-colors" />
                                        <span className="font-medium">{item.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </nav>

                        {/* Footer - Sign Out */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <motion.button
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Sign Out</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

AccountPanel.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onLogout: PropTypes.func.isRequired,
    role: PropTypes.oneOf(['customer', 'provider']).isRequired,
};
