export default function EmptyState({
    icon: Icon,
    title,
    description,
    action = null,
    className = "",
    compact = false,
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 to-white ${
                compact ? "py-8 px-4 min-h-[160px]" : "py-12 px-6 min-h-[220px]"
            } ${className}`}
        >
            {Icon && (
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="text-emerald-700" size={compact ? 24 : 28} />
                </div>
            )}
            <h3 className={`font-bold text-[#154212] mb-2 ${compact ? "text-base" : "text-lg"}`}>
                {title}
            </h3>
            <p className={`text-[#72796e] max-w-md leading-relaxed ${compact ? "text-xs" : "text-sm"}`}>
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
