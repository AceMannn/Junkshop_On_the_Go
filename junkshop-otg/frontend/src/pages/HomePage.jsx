import { useMemo, useState } from 'react';
import { MapPin, Package, Store } from 'lucide-react';
import garbageCollector from '../assets/garbage_collector.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Modal } from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import JunkshopsMap from '../components/maps/JunkshopsMap';
import ShopRating from '../components/ui/ShopRating';
import ReviewSnippet from '../components/ui/ReviewSnippet';
import { useCatalogJunkshops, useFeaturedMaterials } from '../hooks/useCatalogData';
import LoadErrorBanner from '../components/ui/LoadErrorBanner';
import MaterialMarketplaceSection from '../components/marketplace/MaterialMarketplaceSection';
import {
  materialGuides,
  previewRecyclingSteps,
  recyclingDonts,
  recyclingDos,
  recyclingSteps,
} from '../data/recyclingGuide';
import { priceCategories } from '../data/prices';
import { shopStatusBadgeClass } from '../utils/catalogMappers';
import SiteSectionHeader from '../components/ui/SiteSectionHeader';
import SiteButton from '../components/ui/SiteButton';
import {
  siteCardClass,
  siteCardHoverClass,
  siteContainerClass,
  siteHeroGradientClass,
  siteSectionPadClass,
} from '../components/ui/siteUi';

const DATE_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

function formatCategoryLabel(value) {
  if (!value) return 'Uncategorized';
  const normalized = String(value).toLowerCase();
  if (normalized === 'ewaste' || normalized === 'e-waste') return 'E-waste';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getPostedTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export default function HomePage({ onSignInToSell }) {
  const [activeModal, setActiveModal] = useState(null);
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('all');
  const [materialDateSort, setMaterialDateSort] = useState('newest');
  const { shops, loading: shopsLoading, error: shopsError, refresh: refreshShops } = useCatalogJunkshops({
    autoRefresh: false,
    partnersOnly: true,
  });
  const {
    materials,
    loading: materialsLoading,
    error: materialsError,
    refresh: refreshMaterials,
  } = useFeaturedMaterials({ autoRefresh: false });

  const previewShops = useMemo(() => shops.slice(0, 3), [shops]);

  const materialCategoryOptions = useMemo(() => {
    const categories = [...new Set(materials.map((item) => item.category).filter(Boolean))];
    return categories.sort((a, b) => formatCategoryLabel(a).localeCompare(formatCategoryLabel(b)));
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    const rows =
      materialCategoryFilter === 'all'
        ? [...materials]
        : materials.filter((item) => item.category === materialCategoryFilter);

    return rows.sort((a, b) => {
      const diff = getPostedTime(b.postedAt || b.updatedAt) - getPostedTime(a.postedAt || a.updatedAt);
      return materialDateSort === 'newest' ? diff : -diff;
    });
  }, [materials, materialCategoryFilter, materialDateSort]);

  const catalogMaterials = materials;

  const closeModal = () => setActiveModal(null);

  return (
    <div className="site-page-bg">
      <section className={siteHeroGradientClass}>
        <div className="absolute top-10 right-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#154212]/10 rounded-full blur-3xl pointer-events-none" />

        <div className={`${siteContainerClass} pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 relative z-10`}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#154212] mb-4">
                Teresa, Sta. Mesa · Community recycling
              </p>
              <h1 className="mb-6 text-[#191c1c]">
                Recycle Smarter, <span className="text-[#154212]">Earn More.</span>
              </h1>
              <p className="text-lg sm:text-xl text-[#72796e] leading-relaxed max-w-xl">
                Identify recyclables, know their value, and find trusted junkshops in Teresa,
                Sta. Mesa, Manila.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-emerald-200/40 to-transparent rounded-3xl blur-2xl pointer-events-none" />
              <ImageWithFallback
                src={garbageCollector}
                alt="Garbage collector"
                className="relative rounded-2xl shadow-xl ring-1 ring-zinc-200/80 w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      <MaterialMarketplaceSection
        onSignInToSell={onSignInToSell}
        onViewAllPrices={() => setActiveModal('prices')}
      />

      <section className={`${siteSectionPadClass} bg-white`}>
        <div className={siteContainerClass}>
          <SiteSectionHeader
            eyebrow="Nearby partners"
            title="Find Junkshops Near You"
            description="Discover trusted junkshops in Teresa, Sta. Mesa with local pricing and community ratings."
          />
          {shopsError && (
            <LoadErrorBanner
              message={shopsError}
              onRetry={refreshShops}
              className="mb-4"
            />
          )}
          <div className={`${siteCardClass} shadow-md overflow-hidden min-w-0`}>
            <div className="grid min-w-0 lg:h-[22rem] lg:grid-cols-2">
              <div className="min-w-0 self-start p-4 sm:p-6 lg:p-8 bg-white">
                <div>
                  {shopsLoading ? (
                    <p className="text-gray-500">Loading shops...</p>
                  ) : previewShops.length === 0 ? (
                    <EmptyState
                      compact
                      icon={Store}
                      title="No partner shops yet"
                      description="Verified junkshops appear here once providers complete their shop profiles."
                    />
                  ) : (
                    previewShops.map((shop, index) => (
                      <article
                        key={shop.id}
                        className="flex min-w-0 items-stretch gap-3 pb-6 last:pb-0 sm:gap-4 sm:pb-8"
                      >
                        <div className="relative flex w-10 shrink-0 justify-center">
                          {index !== previewShops.length - 1 && (
                            <div className="absolute left-1/2 top-10 h-[calc(100%+2rem)] w-[2px] -translate-x-1/2 rounded-full bg-gray-200" />
                          )}
                          <div className="relative z-10 w-10 h-10 rounded-xl bg-[#154212] flex items-center justify-center shadow-sm">
                            <MapPin className="text-white" size={18} />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 pt-1">
                          <h4 className="mb-2 text-charcoal break-words">{shop.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <ShopRating shop={shop} />
                            <span className={(shop.status === 'Open' || shop.status === 'Open now') ? 'text-eco-green' : shop.status === 'Suspended' ? 'text-amber-700' : 'text-gray-500'}>{shop.status}</span>
                            {shop.isPartner && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Partner</span>
                            )}
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
              <div className="relative h-[22rem] min-h-0 overflow-hidden bg-[#154212] lg:h-full">
                {shopsLoading ? (
                  <div className="flex h-full items-center justify-center p-4 sm:p-8">
                    <p className="text-sm text-white/80 animate-pulse">Loading map…</p>
                  </div>
                ) : previewShops.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-4 sm:p-8">
                    <EmptyState
                      compact
                      inverted
                      icon={MapPin}
                      title="No shop locations yet"
                      description="Partner shops appear here on the map after providers complete setup."
                      className="w-full"
                    />
                  </div>
                ) : (
                  <JunkshopsMap shops={previewShops} className="h-full w-full" fillContainer />
                )}
              </div>
            </div>
          </div>
          <div className="mt-10 text-center">
            <SiteButton
              variant="outline"
              className="!min-h-0 !py-0 !text-sm"
              style={{ height: '34px', paddingInline: '18px', borderRadius: '12px' }}
              onClick={() => setActiveModal('map')}
            >
              Open full map
            </SiteButton>
          </div>
        </div>
      </section>

      <section className={`relative ${siteSectionPadClass} overflow-hidden site-page-bg`}>
        <div className="absolute top-10 left-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className={`${siteContainerClass} relative z-10`}>
          <SiteSectionHeader
            eyebrow="How-to"
            title="Quick Recycling Tips"
            description="Follow these simple steps to prepare your recyclables properly before bringing them to a junkshop."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {previewRecyclingSteps.map((step) => (
              <article
                key={step.number}
                className={`${siteCardClass} ${siteCardHoverClass} overflow-hidden text-center`}
              >
                <div className="h-40 sm:h-44 bg-zinc-100 overflow-hidden">
                  <ImageWithFallback
                    src={step.previewImage}
                    alt={step.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <h4 className="mb-3 text-charcoal">{step.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <SiteButton
              variant="dark"
              className="!min-h-0 !py-0 !text-sm"
              style={{ height: '34px', paddingInline: '18px', borderRadius: '12px' }}
              onClick={() => setActiveModal('guide')}
            >
              View full guide
            </SiteButton>
          </div>
        </div>
      </section>

      <PricesModal isOpen={activeModal === 'prices'} onClose={closeModal} materials={catalogMaterials} />
      <MapModal isOpen={activeModal === 'map'} onClose={closeModal} shops={shops} />
      <GuideModal isOpen={activeModal === 'guide'} onClose={closeModal} />
    </div>
  );
}

function RecyclableMaterialsTable({
  materials,
  categoryOptions,
  categoryFilter,
  dateSort,
  onCategoryChange,
  onDateSortChange,
}) {
  return (
    <div className="rounded-[28px] border border-gray-100 bg-white p-4 shadow-lg sm:p-5 lg:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-start">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Category
            </span>
            <select
              value={categoryFilter}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="w-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-charcoal outline-none transition focus:border-eco-green focus:ring-2 focus:ring-eco-green/15 sm:min-w-44"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {formatCategoryLabel(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Date
            </span>
            <select
              value={dateSort}
              onChange={(event) => onDateSortChange(event.target.value)}
              className="w-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-charcoal outline-none transition focus:border-eco-green focus:ring-2 focus:ring-eco-green/15 sm:min-w-40"
            >
              {DATE_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="scroll-y-clean max-h-[34rem] border border-gray-100">
        <div className="space-y-2 p-2 md:hidden">
          {materials.map((item) => {
            const shopName =
              item.junkshop?.name || (item.source === 'catalog' ? 'Reference catalog' : 'Partner junkshop');
            const shopAddress =
              item.junkshop?.address || (item.source === 'catalog' ? 'Teresa, Sta. Mesa area' : 'Address not listed');
            const postedDate = formatUpdatedDate(item.postedAt || item.updatedAt);

            return (
              <article
                key={item.id}
                className="rounded-[16px] border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-charcoal break-words">{item.material}</p>
                    {item.examples && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-500 break-words">{item.examples}</p>
                    )}
                  </div>
                  <span className="shrink-0 inline-flex rounded-xl bg-sunny-yellow px-2.5 py-1 text-xs font-bold text-charcoal">
                    {item.perKgPrice}/{item.unit || 'kg'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                    {formatCategoryLabel(item.category)}
                  </span>
                  <span className="break-words">{shopName}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 break-words">{shopAddress}</p>
                <p className="mt-1 text-xs text-gray-500">Posted {postedDate}</p>
              </article>
            );
          })}
        </div>

        <table className="hidden md:table w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#f3f7f2] text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-bold">Material</th>
              <th className="px-4 py-3 font-bold">Category</th>
              <th className="px-4 py-3 font-bold">Junkshop</th>
              <th className="px-4 py-3 font-bold">Address</th>
              <th className="px-4 py-3 font-bold">Posted</th>
              <th className="px-4 py-3 text-right font-bold">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {materials.map((item) => {
              const shopName =
                item.junkshop?.name || (item.source === 'catalog' ? 'Reference catalog' : 'Partner junkshop');
              const shopAddress =
                item.junkshop?.address || (item.source === 'catalog' ? 'Teresa, Sta. Mesa area' : 'Address not listed');
              const postedDate = formatUpdatedDate(item.postedAt || item.updatedAt);

              return (
                <tr key={item.id} className="align-top transition-colors hover:bg-emerald-50/40">
                  <td className="px-4 py-4">
                    <p className="font-bold text-charcoal">{item.material}</p>
                    {item.examples && (
                      <p className="mt-1 max-w-44 text-xs leading-relaxed text-gray-500">
                        {item.examples}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      {formatCategoryLabel(item.category)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-charcoal">{shopName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.source === 'catalog' ? 'Catalog price' : 'Posted by shop'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    <p className="max-w-60 leading-relaxed">{shopAddress}</p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">{postedDate}</td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex rounded-xl bg-sunny-yellow px-3 py-1.5 text-sm font-bold text-charcoal">
                      {item.perKgPrice}/{item.unit || 'kg'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionAction({ children, onClick, variant = 'primary' }) {
  return (
    <div className="mt-10 text-center">
      <SiteButton variant={variant} onClick={onClick}>
        {children}
      </SiteButton>
    </div>
  );
}

function PricesModal({ isOpen, onClose, materials }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      mobileSheet
      title="Recyclable Materials Price Guide"
      description="Reference prices for Teresa, Sta. Mesa. Actual prices may vary by junkshop and item condition."
    >
      <div className="space-y-8">
        {priceCategories.filter((category) => category.id !== 'all').map((category) => {
          const categoryPrices = materials.filter((item) => item.category === category.id);
          if (categoryPrices.length === 0) return null;
          return (
            <section key={category.id}>
              <h3 className="mb-4 capitalize text-eco-green">{category.label}</h3>

              <div className="space-y-2 md:hidden">
                {categoryPrices.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[16px] border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-charcoal">{item.material}</p>
                      <p className="shrink-0 font-semibold text-eco-green">{item.perKgPrice}</p>
                    </div>
                    {item.examples && (
                      <p className="mt-1 text-xs text-gray-600">{item.examples}</p>
                    )}
                    {item.notes && (
                      <p className="mt-1 text-xs text-gray-500">{item.notes}</p>
                    )}
                  </article>
                ))}
              </div>

              <div className="hidden md:block scroll-x-clean rounded-[16px] border border-gray-100">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-light-gray text-charcoal">
                    <tr>
                      <th className="px-4 py-3">Material</th>
                      <th className="px-4 py-3">Examples</th>
                      <th className="px-4 py-3 whitespace-nowrap">Per kg</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categoryPrices.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-3 font-semibold text-charcoal">{item.material}</td>
                        <td className="px-4 py-3 text-gray-600">{item.examples || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-eco-green whitespace-nowrap">{item.perKgPrice}</td>
                        <td className="px-4 py-3 text-gray-600">{item.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}

function MapModal({ isOpen, onClose, shops }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      mobileSheet
      title="Junkshops in Teresa, Sta. Mesa"
      description="Live junkshop pins from our database. Partner shops support in-app pickups."
      size="fullscreen"
    >
      <div className="flex h-full flex-col gap-4 md:grid md:grid-cols-[1fr_16rem] lg:grid-cols-[1fr_22rem]">
        <div className="scroll-y-clean order-1 space-y-3 max-h-[42vh] md:order-2 md:max-h-none pr-1">
          {shops.map((shop) => (
            <article key={shop.id} className="rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-charcoal">{shop.name}</h4>
                  <p className="mt-1 text-sm text-gray-600">{shop.address}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${shopStatusBadgeClass(shop.status)}`}>{shop.status}</span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p className="flex flex-wrap items-center gap-2">
                  {shop.distance} away · <ShopRating shop={shop} />
                </p>
                <p>{shop.hours}</p>
                <p>{shop.phone}</p>
                <p className="font-semibold text-charcoal">{shop.topPrice}</p>
                {shop.latestReview && (
                  <ReviewSnippet review={shop.latestReview} className="mt-2" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(shop.materials || []).map((material) => (
                  <span key={material} className="rounded-full bg-light-gray px-3 py-1 text-xs font-semibold text-charcoal">{material}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <JunkshopsMap
          shops={shops}
          className="order-2 fluid-map-height md:order-1"
        />
      </div>
    </Modal>
  );
}

function GuideModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      mobileSheet
      title="Full Recycling Guide"
      description="Prepare recyclables correctly so junkshops can price them faster and contamination stays low."
    >
      <div className="space-y-10">
        <section>
          <h3 className="mb-5 text-eco-green">5 Simple Steps</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {recyclingSteps.map((step) => (
              <article key={step.number} className="rounded-[18px] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-eco-green text-lg font-bold text-white">{step.number}</div>
                  <div>
                    <h4>{step.title}</h4>
                    <p className="mt-1 text-gray-600">{step.description}</p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
                      {step.tips.map((tip) => <li key={tip}>{tip}</li>)}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[18px] bg-eco-green/10 p-5">
            <h3 className="mb-4 text-eco-green">Do</h3>
            <ul className="space-y-2 text-gray-700">{recyclingDos.map((item) => <li key={item}>✓ {item}</li>)}</ul>
          </div>
          <div className="rounded-[18px] bg-red-50 p-5">
            <h3 className="mb-4 text-red-600">Don't</h3>
            <ul className="space-y-2 text-gray-700">{recyclingDonts.map((item) => <li key={item}>× {item}</li>)}</ul>
          </div>
        </section>

        <section>
          <h3 className="mb-5 text-eco-green">Material Preparation</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {materialGuides.map((guide) => (
              <article key={guide.material} className="rounded-[18px] border border-gray-100 p-5">
                <h4>{guide.material}</h4>
                <p className="mt-2 text-sm text-gray-600"><span className="font-semibold text-charcoal">Prep:</span> {guide.prep}</p>
                <p className="mt-3 text-sm font-semibold text-eco-green">Accepted</p>
                <p className="text-sm text-gray-600">{guide.accepted.join(', ')}</p>
                <p className="mt-3 text-sm font-semibold text-red-600">Not accepted</p>
                <p className="text-sm text-gray-600">{guide.notAccepted.join(', ')}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
