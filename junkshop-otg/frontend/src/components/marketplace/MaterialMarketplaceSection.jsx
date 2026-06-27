import { useMemo, useState } from 'react';
import { ChevronRight, Package } from 'lucide-react';
import { useCatalogJunkshops, useFeaturedMaterials } from '../../hooks/useCatalogData';
import { formatUpdatedDate } from '../../utils/catalogMappers';
import ShopBadges from '../ui/ShopBadges';
import EmptyState from '../ui/EmptyState';
import LoadErrorBanner from '../ui/LoadErrorBanner';
import { siteContainerClass, siteSectionPadClass } from '../ui/siteUi';
import { useShopPhoto } from '../../hooks/useShopPhoto';

const HIGHLIGHTS = [
  { id: 'plastic', label: 'Plastic' },
  { id: 'metal', label: 'Metal' },
  { id: 'paper', label: 'Paper' },
  { id: 'e-waste', label: 'E-waste' },
  { id: 'glass', label: 'Glass' },
  { id: 'cardboard', label: 'Cardboard' },
];

function formatCategoryLabel(value) {
  if (!value) return 'Other';
  const normalized = String(value).toLowerCase();
  if (normalized === 'ewaste' || normalized === 'e-waste') return 'E-waste';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatPrice(value, unit = 'kg') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const suffix = unit === 'piece' ? '/pc' : '/kg';
  return `₱${Number(value)}${suffix}`;
}

function priceRangeLabel(rows) {
  if (!rows.length) return '—';
  const prices = rows.map((row) => Number(row.price)).filter((n) => Number.isFinite(n));
  if (!prices.length) return '—';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const unit = rows[0]?.unit || 'kg';
  const suffix = unit === 'piece' ? '/pc' : '/kg';
  if (min === max) return `₱${min}${suffix}`;
  return `₱${min}–₱${max}${suffix}`;
}

export default function MaterialMarketplaceSection({
  title = 'What Can You Recycle?',
  description = 'Browse buy rates from partner junkshops and reference catalog prices in your area.',
  isAuthenticated = false,
  onSignInToSell,
  onBookNow,
  onViewAllPrices,
  compact = false,
}) {
  const { materials, loading, error, refresh } = useFeaturedMaterials({ autoRefresh: false });
  const { shops } = useCatalogJunkshops({ partnersOnly: true, autoRefresh: false });
  const [activeCategory, setActiveCategory] = useState(HIGHLIGHTS[0].id);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedShopId, setSelectedShopId] = useState('');

  const categoryMaterials = useMemo(() => {
    return materials.filter((item) => {
      const cat = String(item.category || '').toLowerCase();
      const key = String(activeCategory).toLowerCase();
      if (key === 'e-waste') return cat === 'e-waste' || cat === 'ewaste';
      return cat === key;
    });
  }, [materials, activeCategory]);

  const materialOptions = useMemo(() => {
    const seen = new Map();
    categoryMaterials.forEach((item) => {
      const key = `${item.material}|${item.unit || 'kg'}`;
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    });
    return [...seen.values()];
  }, [categoryMaterials]);

  const selectedMaterial = useMemo(() => {
    if (selectedMaterialId) {
      return materialOptions.find((item) => item.id === selectedMaterialId) || materialOptions[0];
    }
    return materialOptions[0] || null;
  }, [materialOptions, selectedMaterialId]);

  const shopOptions = useMemo(() => {
    if (!selectedMaterial) return [];
    const name = selectedMaterial.material?.toLowerCase();
    return shops.filter((shop) =>
      (shop.listingPrices || []).some(
        (row) =>
          String(row.name || '').toLowerCase() === name &&
          (row.unit || 'kg') === (selectedMaterial.unit || 'kg')
      )
    );
  }, [shops, selectedMaterial]);

  const selectedShop = useMemo(() => {
    if (selectedShopId) {
      return shopOptions.find((shop) => String(shop._id || shop.id) === String(selectedShopId));
    }
    return shopOptions[0] || null;
  }, [shopOptions, selectedShopId]);
  const selectedShopPhoto = useShopPhoto(selectedShop);

  const livePrice = useMemo(() => {
    if (!selectedMaterial || !selectedShop) return null;
    const match = (selectedShop.listingPrices || []).find(
      (row) =>
        String(row.name || '').toLowerCase() === String(selectedMaterial.material || '').toLowerCase() &&
        (row.unit || 'kg') === (selectedMaterial.unit || 'kg')
    );
    return match?.price ?? null;
  }, [selectedMaterial, selectedShop]);

  const isReferenceOnly = selectedMaterial?.source === 'catalog' && shopOptions.length === 0;

  const handleBook = () => {
    if (!selectedMaterial) return;
    if (!isAuthenticated) {
      onSignInToSell?.(selectedMaterial);
      return;
    }
    onBookNow?.({
      name: selectedMaterial.material,
      category: selectedMaterial.category,
      catalogId: selectedMaterial.id,
      unit: selectedMaterial.unit || 'kg',
      junkshopId: selectedShop?._id || selectedShop?.id,
    });
  };

  return (
    <section className={compact ? 'space-y-5' : `${siteSectionPadClass} site-page-bg`}>
      <div className={compact ? '' : siteContainerClass}>
        <div className={compact ? 'mb-4' : 'text-center mb-10'}>
          <h2 className={compact ? 'text-lg sm:text-xl font-bold text-[#191c1c]' : 'mb-4'}>{title}</h2>
          <p className={`text-[#72796e] ${compact ? 'text-sm max-w-2xl' : 'text-xl max-w-3xl mx-auto'}`}>
            {description}
          </p>
        </div>

        {error && <LoadErrorBanner message={error} onRetry={refresh} className="mb-4" />}

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading prices…</p>
        ) : materials.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No price data yet"
            description="Partner prices appear when verified shops publish materials."
          />
        ) : (
          <>
            <div className="scroll-x-clean flex gap-2 pb-2">
              {HIGHLIGHTS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedMaterialId('');
                    setSelectedShopId('');
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-[#154212] text-white border-[#154212]'
                      : 'bg-white text-[#42493e] border-zinc-200 hover:border-emerald-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid min-w-0 grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    {formatCategoryLabel(activeCategory)}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#191c1c]">
                    {priceRangeLabel(categoryMaterials)}
                  </p>
                  <p className="text-xs text-[#72796e] mt-1">
                    Updated{' '}
                    {formatUpdatedDate(
                      categoryMaterials[0]?.postedAt || categoryMaterials[0]?.updatedAt
                    )}
                  </p>
                </div>

                {materialOptions.length === 0 ? (
                  <p className="text-sm text-[#72796e]">No listings in this category yet.</p>
                ) : (
                  <>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#72796e]">
                        Material
                      </span>
                      <select
                        value={selectedMaterial?.id || ''}
                        onChange={(event) => {
                          setSelectedMaterialId(event.target.value);
                          setSelectedShopId('');
                        }}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                      >
                        {materialOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.material} ({item.unit === 'piece' ? 'per piece' : 'per kg'})
                          </option>
                        ))}
                      </select>
                    </label>

                    {selectedMaterial?.examples && (
                      <p className="text-sm text-[#42493e] leading-relaxed">{selectedMaterial.examples}</p>
                    )}

                    {isReferenceOnly && (
                      <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                        Reference only — no shop yet
                      </span>
                    )}

                    {shopOptions.length > 0 && (
                      <label className="block space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#72796e]">
                          Junkshop
                        </span>
                        <select
                          value={selectedShop ? String(selectedShop._id || selectedShop.id) : ''}
                          onChange={(event) => setSelectedShopId(event.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                        >
                          {shopOptions.map((shop) => (
                            <option key={shop.id} value={shop._id || shop.id}>
                              {shop.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </>
                )}
              </div>

              <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                {selectedShopPhoto ? (
                  <img
                    src={selectedShopPhoto}
                    alt={selectedShop.name}
                    className="w-full aspect-[4/3] max-h-48 object-cover rounded-xl border border-zinc-100"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] max-h-48 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center text-sm text-[#72796e]">
                    Shop photo coming soon
                  </div>
                )}

                <div>
                  <p className="font-bold text-lg text-[#191c1c]">
                    {selectedShop?.name || 'Reference catalog'}
                  </p>
                  <ShopBadges badges={selectedShop?.badges} className="mt-2" />
                  <p className="mt-2 text-sm text-[#72796e] leading-relaxed">
                    {selectedShop?.address || 'Teresa, Sta. Mesa area — reference pricing'}
                  </p>
                  {livePrice != null && (
                    <p className="mt-3 text-xl font-bold text-emerald-800">
                      {formatPrice(livePrice, selectedMaterial?.unit)}
                    </p>
                  )}
                  {!livePrice && selectedMaterial && (
                    <p className="mt-3 text-xl font-bold text-emerald-800">
                      {selectedMaterial.perKgPrice}
                      <span className="text-sm font-semibold text-[#72796e] ml-1">
                        / {selectedMaterial.unit === 'piece' ? 'pc' : 'kg'}
                      </span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleBook}
                  disabled={!selectedMaterial || isReferenceOnly}
                  className="w-full rounded-xl bg-[#154212] text-white py-3 text-sm font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAuthenticated ? 'Book / Sell now' : 'Sign in to sell'}
                </button>
              </div>
            </div>

            {onViewAllPrices && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={onViewAllPrices}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline"
                >
                  View all prices
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
