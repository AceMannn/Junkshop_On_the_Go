import { Box, Cog, FileText, Archive, Cpu, GlassWater, ChevronDown, ChevronUp } from 'lucide-react';

export const SELL_CATEGORIES = [
  { id: 'plastic',   label: 'Plastic',   Icon: Box        },
  { id: 'metal',     label: 'Metal',     Icon: Cog        },
  { id: 'paper',     label: 'Paper',     Icon: FileText   },
  { id: 'cardboard', label: 'Cardboard', Icon: Archive    },
  { id: 'e-waste',   label: 'E-waste',   Icon: Cpu        },
  { id: 'glass',     label: 'Glass',     Icon: GlassWater },
];

/**
 * 6-tile category grid for the Sell your recyclables split card.
 * Lit tiles are clickable and expand an inline list of materials + prices.
 */
export default function ShopCategoryMaterialGrid({
  byCategory,
  expandedCategory,
  onCategoryClick,
  onMaterialSelect,
  selectedMaterial,
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#72796e] mb-2">
        Materials accepted
      </p>
      <div className="grid grid-cols-3 gap-2">
        {SELL_CATEGORIES.map(({ id, label, Icon }) => {
          const items = byCategory[id] || [];
          const lit = items.length > 0;
          const expanded = expandedCategory === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => lit && onCategoryClick(id)}
              disabled={!lit}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all
                ${lit
                  ? expanded
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:shadow-sm cursor-pointer'
                  : 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-default'
                }`}
              title={lit ? `${label} — ${items.length} material${items.length !== 1 ? 's' : ''}` : `No ${label} listed`}
            >
              <Icon size={20} strokeWidth={lit ? 2 : 1.5} />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
              {lit && (
                <span className="text-[9px] leading-none opacity-70">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {expandedCategory && (byCategory[expandedCategory] || []).length > 0 && (
        <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-emerald-100">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              {SELL_CATEGORIES.find((c) => c.id === expandedCategory)?.label}
            </span>
            <button
              type="button"
              onClick={() => onCategoryClick(expandedCategory)}
              className="text-emerald-600 hover:text-emerald-800"
              aria-label="Collapse"
            >
              <ChevronUp size={14} />
            </button>
          </div>
          <div className="divide-y divide-emerald-100">
            {(byCategory[expandedCategory] || []).map((item, i) => {
              const isSelected =
                selectedMaterial?.name === item.name && selectedMaterial?.unit === item.unit;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onMaterialSelect(isSelected ? null : item)}
                  className={`w-full flex justify-between items-center px-3 py-2 text-sm transition-colors text-left
                    ${isSelected
                      ? 'bg-emerald-200 text-emerald-900 font-semibold'
                      : 'hover:bg-emerald-100 text-[#191c1c]'
                    }`}
                >
                  <span>{item.name}</span>
                  <span className="font-semibold text-emerald-700 shrink-0 ml-2">
                    ₱{item.price}/{item.unit === 'piece' ? 'pc' : 'kg'}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedMaterial && (
            <p className="px-3 py-1.5 text-[10px] text-emerald-700 bg-emerald-100 border-t border-emerald-200">
              Tap <strong>Book now</strong> below to pre-fill{' '}
              <em>{selectedMaterial.name}</em> in your booking.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
