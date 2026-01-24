import { Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

export function SearchBar({
    placeholder = 'Search...',
    value = '',
    onChange,
    onFilterClick,
    showFilter = false
}) {
    return (
        <motion.div
            className="relative flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-light-gray focus:border-eco-green focus:outline-none transition-colors"
                />
            </div>
            {showFilter && (
                <motion.button
                    className="p-3 rounded-[12px] border-2 border-light-gray hover:border-eco-green transition-colors"
                    onClick={onFilterClick}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                >
                    <SlidersHorizontal size={20} className="text-charcoal" />
                </motion.button>
            )}
        </motion.div>
    );
}
