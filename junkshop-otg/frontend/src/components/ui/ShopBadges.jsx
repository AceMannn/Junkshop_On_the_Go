const BADGE_META = {
  verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  trusted: { label: 'Trusted Seller', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  top: { label: 'Top Junkshop', className: 'bg-amber-100 text-amber-900 border-amber-200' },
};

export default function ShopBadges({ badges = [], className = '' }) {
  const rows = (badges || []).filter((id) => BADGE_META[id]);
  if (!rows.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {rows.map((id) => (
        <span
          key={id}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_META[id].className}`}
        >
          {BADGE_META[id].label}
        </span>
      ))}
    </div>
  );
}
