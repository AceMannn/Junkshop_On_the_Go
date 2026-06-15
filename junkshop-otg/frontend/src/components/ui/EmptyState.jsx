export default function EmptyState({
    icon: Icon,
    title,
    description,
    action = null,
    className = "",
    compact = false,
    inverted = false,
}) {
    const shellClass = inverted
        ? "border-2 border-dashed border-white/50 bg-white/10"
        : "border-2 border-dashed border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 to-white";

    return (
        <div
            className={`flex flex-col items-center justify-center text-center rounded-2xl ${shellClass} ${
                compact ? "py-8 px-4 min-h-[160px]" : "py-12 px-6 min-h-[220px]"
            } ${className}`}
        >
            {Icon && (
                <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm ${
                        inverted ? "bg-white/20" : "bg-emerald-100"
                    }`}
                >
                    <Icon
                        className={inverted ? "text-white" : "text-emerald-700"}
                        size={compact ? 24 : 28}
                    />
                </div>
            )}
            <h3
                className={`font-bold mb-2 ${compact ? "text-base" : "text-lg"} ${
                    inverted ? "text-white" : "text-[#154212]"
                }`}
            >
                {title}
            </h3>
            <p
                className={`max-w-md leading-relaxed ${compact ? "text-xs" : "text-sm"} ${
                    inverted ? "text-white/85" : "text-[#72796e]"
                }`}
            >
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
