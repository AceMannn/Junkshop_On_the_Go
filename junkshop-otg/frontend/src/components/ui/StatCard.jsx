import { Info } from 'lucide-react';

const STAT_COLORS = {
  green: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', border: 'border-t-emerald-400' },
  amber: { iconBg: 'bg-amber-100', iconText: 'text-amber-700', border: 'border-t-amber-400' },
  blue: { iconBg: 'bg-blue-100', iconText: 'text-blue-700', border: 'border-t-blue-400' },
  teal: { iconBg: 'bg-teal-100', iconText: 'text-teal-700', border: 'border-t-teal-400' },
};

export default function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  helper,
  helperMode = 'tooltip',
  showHelperIcon = true,
  accentColor = 'green',
  layout = 'vertical',
  suffix,
  className = '',
}) {
  const c = STAT_COLORS[accentColor] || STAT_COLORS.green;

  if (layout === 'horizontal') {
    return (
      <div
        className={`bg-white px-4 py-3 rounded-xl border border-zinc-200 border-t-2 ${c.border} shadow-sm flex items-center gap-3 ${className}`}
      >
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg} ${c.iconText}`}
          >
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] text-[#72796e] uppercase tracking-wide font-semibold">{label}</p>
          <p className="text-lg font-bold text-[#191c1c] leading-tight">
            {value}
            {unit && (
              <span className="text-xs font-medium text-[#72796e] ml-1">{unit}</span>
            )}
            {suffix}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 border-t-2 ${c.border} shadow-[0_4px_12px_rgba(141,170,145,0.12)] flex flex-col gap-3 ${className}`}
    >
      <div className="flex items-start justify-between">
        {Icon ? (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg} ${c.iconText}`}
          >
            <Icon size={18} />
          </div>
        ) : (
          <div />
        )}
        {showHelperIcon && helper && helperMode === 'tooltip' && (
          <Info size={15} className="text-zinc-400 cursor-help shrink-0" title={helper} />
        )}
      </div>
      <div>
        <p className="text-[10px] sm:text-xs text-[#72796e] uppercase tracking-wider font-semibold mb-1">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-bold text-[#191c1c] flex items-end gap-1.5 flex-wrap">
          {value}
          {unit && (
            <span className="text-xs sm:text-sm font-semibold text-[#72796e] pb-0.5">{unit}</span>
          )}
        </p>
        {helper && helperMode === 'inline' && (
          <p className="text-xs text-[#72796e] mt-1">{helper}</p>
        )}
      </div>
    </div>
  );
}
