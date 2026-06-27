import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Phone,
  Calendar,
  Star,
  SlidersHorizontal,
} from 'lucide-react';
import VerifiedPartnerIcon, { isVerified } from '../ui/VerifiedPartnerIcon';
import { useShopPhoto } from '../../hooks/useShopPhoto';
import { useCatalogJunkshops } from '../../hooks/useCatalogData';
import { shopAutoDescription } from '../../utils/shopDescription';
import { shortLocation } from '../../utils/shortLocation';
import { formatOperatingHoursSummary } from '../../utils/operatingHours';
import ShopCategoryMaterialGrid, { SELL_CATEGORIES } from './ShopCategoryMaterialGrid';
import ConfirmUnverifiedShopModal from '../ui/ConfirmUnverifiedShopModal';

const SORT_OPTIONS = [
  { id: 'latest',   label: 'Latest'    },
  { id: 'toprated', label: 'Top rated' },
];

function normalizeCategory(cat) {
  const raw = String(cat || '').toLowerCase().replace('-', '');
  if (raw === 'ewaste') return 'e-waste';
  return raw;
}

function buildByCategory(listingPrices) {
  const map = {};
  (listingPrices || []).forEach((item) => {
    const cat = normalizeCategory(item.category);
    if (!map[cat]) map[cat] = [];
    map[cat].push(item);
  });
  return map;
}

function formatActiveDays(operatingHours) {
  if (!Array.isArray(operatingHours) || operatingHours.length === 0) return '';
  const dayMap = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
  const open = operatingHours
    .filter((r) => !r.closed && r.open && r.close)
    .map((r) => dayMap[r.day] || r.day);
  return open.length ? open.join(', ') : '';
}

function StarRating({ rating, reviewCount }) {
  if (!rating || rating === 0) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-amber-500">
      <Star size={11} fill="currentColor" strokeWidth={0} />
      <span className="font-semibold text-[#42493e]">{Number(rating).toFixed(1)}</span>
      {reviewCount > 0 && (
        <span className="text-[#72796e]">({reviewCount})</span>
      )}
    </div>
  );
}

function ShopHeroPhoto({ shop }) {
  const photo = useShopPhoto(shop);
  return (
    <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-zinc-100 mb-4 shrink-0">
      {photo ? (
        <img src={photo} alt={shop.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 select-none">
          Shop photo coming soon
        </div>
      )}
    </div>
  );
}

function ShopCard({ shop, onViewProfile, onBookNow }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const byCategory = useMemo(() => buildByCategory(shop.listingPrices), [shop.listingPrices]);
  const verified = isVerified(shop);
  const hasNoMaterials = !shop.listingPrices?.length;

  const description = shopAutoDescription(shop.name, shop.description);
  const location = shortLocation(shop.address);
  const days = formatActiveDays(shop.operatingHours);
  const hours = shop.hours || formatOperatingHoursSummary(shop.operatingHours);

  const handleCategoryClick = (catId) => {
    if (expandedCategory === catId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(catId);
      setSelectedMaterial(null);
    }
  };

  const handleMaterialSelect = (item) => {
    setSelectedMaterial(item);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT: photo, name, description, buttons */}
        <div className="flex flex-col p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-zinc-100">
          <ShopHeroPhoto shop={shop} />

          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-lg text-[#191c1c] leading-snug">{shop.name}</h3>
            {verified && <VerifiedPartnerIcon size="md" />}
          </div>

          <StarRating rating={shop.rating} reviewCount={shop.reviewCount} />

          <p className="text-sm text-[#72796e] leading-relaxed mt-2 mb-5 flex-1">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
            <button
              type="button"
              onClick={() => onBookNow(shop, selectedMaterial)}
              disabled={hasNoMaterials}
              title={hasNoMaterials ? 'No materials listed yet' : undefined}
              className="flex-1 rounded-xl bg-[#154212] text-white py-2.5 text-sm font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {hasNoMaterials ? 'No materials listed' : 'Book now'}
            </button>
            <button
              type="button"
              onClick={() => onViewProfile(shop)}
              className="flex-1 rounded-xl border border-[#154212] text-[#154212] py-2.5 text-sm font-semibold hover:bg-emerald-50 transition-colors"
            >
              View Shop Profile
            </button>
          </div>
        </div>

        {/* RIGHT: category grid + info rows */}
        <div className="flex flex-col p-5 sm:p-6 gap-4">
          <ShopCategoryMaterialGrid
            byCategory={byCategory}
            expandedCategory={expandedCategory}
            onCategoryClick={handleCategoryClick}
            onMaterialSelect={handleMaterialSelect}
            selectedMaterial={selectedMaterial}
          />

          <div className="space-y-1.5">
            {days && (
              <div className="flex items-start gap-2 text-sm text-[#42493e]">
                <Calendar size={14} className="mt-0.5 shrink-0 text-[#72796e]" />
                <span>{days}</span>
              </div>
            )}
            {hours && hours !== 'Hours not set' && (
              <div className="flex items-start gap-2 text-sm text-[#42493e]">
                <Clock size={14} className="mt-0.5 shrink-0 text-[#72796e]" />
                <span>{hours}</span>
              </div>
            )}
            {shop.phone && (
              <div className="flex items-center gap-2 text-sm text-[#42493e]">
                <Phone size={14} className="shrink-0 text-[#72796e]" />
                <span>{shop.phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-start gap-2 text-sm text-[#42493e]">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#72796e]" />
                <span className="line-clamp-2">{location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerSellRecyclablesSection({ onViewProfile, onBookNow }) {
  const { shops: allShops, loading } = useCatalogJunkshops({
    partnersOnly: true,
    withPending: true,
    autoRefresh: true,
  });

  const [sortMode, setSortMode] = useState('latest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [shopIndex, setShopIndex] = useState(0);
  const [pendingBook, setPendingBook] = useState(null);

  const partnerShops = useMemo(
    () => allShops.filter((s) => s.isPartner),
    [allShops]
  );

  const filtered = useMemo(() => {
    let list = partnerShops;
    if (categoryFilter !== 'all') {
      list = list.filter((shop) =>
        (shop.listingPrices || []).some(
          (item) => normalizeCategory(item.category) === categoryFilter
        )
      );
    }
    if (sortMode === 'toprated') {
      list = [...list].sort((a, b) => {
        const rDiff = (b.rating || 0) - (a.rating || 0);
        if (rDiff !== 0) return rDiff;
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      });
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }
    return list;
  }, [partnerShops, sortMode, categoryFilter]);

  const safeIndex = Math.min(shopIndex, Math.max(0, filtered.length - 1));
  const currentShop = filtered[safeIndex] || null;
  const total = filtered.length;
  const hasMultiple = total > 1;

  const goPrev = useCallback(
    () => setShopIndex((i) => (i - 1 + total) % total),
    [total]
  );
  const goNext = useCallback(
    () => setShopIndex((i) => (i + 1) % total),
    [total]
  );

  const handleFilterChange = (catId) => {
    setCategoryFilter(catId);
    setShopIndex(0);
  };

  const handleSortChange = (mode) => {
    setSortMode(mode);
    setShopIndex(0);
  };

  const handleBookNow = useCallback(
    (shop, prefillMaterial) => {
      if (shop.verificationStatus !== 'approved') {
        setPendingBook({ shop, prefillMaterial });
      } else {
        onBookNow(shop, prefillMaterial);
      }
    },
    [onBookNow]
  );

  const handleConfirmBook = () => {
    if (pendingBook) {
      onBookNow(pendingBook.shop, pendingBook.prefillMaterial);
    }
    setPendingBook(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[#191c1c]">Sell your recyclables</h2>
          <p className="text-sm text-[#72796e]">
            Browse partner junkshops and book a pickup or drop-off.
          </p>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {/* Sort */}
        <div className="flex rounded-xl overflow-hidden border border-zinc-200 shrink-0">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSortChange(opt.id)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                sortMode === opt.id
                  ? 'bg-[#154212] text-white'
                  : 'bg-white text-[#42493e] hover:bg-zinc-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          <button
            key="all"
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              categoryFilter === 'all'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-[#42493e] border-zinc-200 hover:border-zinc-300'
            }`}
          >
            All
          </button>
          {SELL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleFilterChange(cat.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-[#42493e] border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40 text-sm text-[#72796e]">
          Loading shops…
        </div>
      )}

      {!loading && total === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-[#72796e]">
          {categoryFilter !== 'all'
            ? `No partner shops accept ${SELL_CATEGORIES.find((c) => c.id === categoryFilter)?.label || categoryFilter} yet.`
            : 'No partner junkshops available yet. Check back soon!'}
        </div>
      )}

      {!loading && currentShop && (
        <>
          {/* Shop navigation */}
          {hasMultiple && (
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-sm"
                aria-label="Previous shop"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-[#72796e] font-medium">
                {safeIndex + 1} / {total}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-sm"
                aria-label="Next shop"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          <ShopCard
            key={currentShop.id || currentShop._id}
            shop={currentShop}
            onViewProfile={onViewProfile}
            onBookNow={handleBookNow}
          />
        </>
      )}

      {pendingBook && (
        <ConfirmUnverifiedShopModal
          shop={pendingBook.shop}
          onConfirm={handleConfirmBook}
          onCancel={() => setPendingBook(null)}
        />
      )}
    </section>
  );
}
