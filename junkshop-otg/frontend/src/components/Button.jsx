import { motion as Motion } from 'framer-motion';

export function Button({
    children,
    variant = 'primary',
    onClick,
    className = '',
    type = 'button',
    disabled = false
}) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[12px] font-semibold transition-all shadow-md disabled:cursor-not-allowed disabled:opacity-60';

    const variants = {
        primary: 'bg-eco-green text-white hover:bg-[#358F52]',
        secondary: 'bg-clean-blue text-white hover:bg-[#3D8EE8]',
        outline: 'bg-white text-eco-green border-2 border-eco-green hover:bg-eco-green hover:text-white',
        ghost: 'bg-transparent text-charcoal shadow-none hover:bg-light-gray',
        danger: 'bg-red-600 text-white hover:bg-red-700'
    };

    return (
        <Motion.button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
            type={type}
            disabled={disabled}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
        >
            {children}
        </Motion.button>
    );
}
