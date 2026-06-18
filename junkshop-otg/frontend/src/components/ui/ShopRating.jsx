import { Star } from 'lucide-react';
import { formatShopRating } from '../../utils/shopRating';

export default function ShopRating({ shop, className = '', showCount = true }) {
  const info = formatShopRating(shop);

  if (!info.hasReviews) {
    return (
      <span className={`text-xs text-[#72796e] italic ${className}`}>
        {info.shortLabel}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-amber-600 ${className}`}>
      <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" />
      <span className="text-sm font-semibold text-[#191c1c]">{info.rating}</span>
      {showCount && (
        <span className="text-xs text-[#72796e] font-normal">
          ({info.reviewCount})
        </span>
      )}
    </span>
  );
}
