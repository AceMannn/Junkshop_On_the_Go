import { motion } from 'framer-motion';

export function Button({
    children,
    variant = 'primary',
    onClick,
    className = '',
    type = 'button'
}) {
    const baseStyles = 'px-6 py-3 rounded-[12px] font-semibold transition-all shadow-md';

    const variants = {
        primary: 'bg-eco-green text-white hover:bg-[#358F52]',
        secondary: 'bg-clean-blue text-white hover:bg-[#3D8EE8]',
        outline: 'bg-white text-eco-green border-2 border-eco-green hover:bg-eco-green hover:text-white'
    };

    return (
        <motion.button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
            type={type}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
        >
            {children}
        </motion.button>
    );
}
