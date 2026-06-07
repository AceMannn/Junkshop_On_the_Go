import { motion as Motion } from 'framer-motion';

export function Card({ children, className = '', hover = true, delay = 0 }) {
    return (
        <Motion.div
            className={`bg-white rounded-card border border-gray-100 p-6 shadow-sm ${hover ? 'transition-all' : ''} ${className}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            whileHover={hover ? { y: -8, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' } : {}}
        >
            {children}
        </Motion.div>
    );
}
