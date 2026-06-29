import { useMemo, useState } from 'react';
import { MapPin, Store } from 'lucide-react';
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

function formatCategoryLabel(value) {
  if (!value) return 'Uncategorized';
  const normalized = String(value).toLowerCase();
  if (normalized === 'ewaste' || normalized === 'e-waste') return 'E-waste';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function HomePage() {
  const [activeModal, setActiveModal] = useState(null);
  const { shops, loading: shopsLoading, error: shopsError, refresh: refreshShops } = useCatalogJunkshops({
    autoRefresh: false,
    partnersOnly: true,
  });
  const { materials } = useFeaturedMaterials({ autoRefresh: false });

  const previewShops = useMemo(() => shops.slice(0, 3), [shops]);

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

      <MaterialMarketplaceSection />

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
  const [selectedShopId, setSelectedShopId] = useState(() => shops[0]?.id ?? null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      mobileSheet
      title="Junkshops Near You"
      description="Select a shop to locate it on the map."
      size="fullscreen"
    >
      <div className="flex h-full min-h-0 flex-col gap-0 md:grid md:grid-cols-[1fr_20rem] lg:grid-cols-[1fr_24rem]">
        {/* Map — left / bottom on mobile */}
        <div className="order-2 min-h-[45vw] md:order-1 md:min-h-0 md:h-full overflow-hidden">
          <JunkshopsMap
            shops={shops}
            selectedId={selectedShopId}
            onSelectShop={setSelectedShopId}
            className="h-full w-full"
            fillContainer
          />
        </div>

        {/* Shop list — right sidebar / top on mobile */}
        <div className="order-1 md:order-2 scroll-y-clean flex flex-col gap-3 p-4 max-h-[40vh] md:max-h-none md:overflow-y-auto border-l border-zinc-100">
          {shops.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[#72796e]">
              No shops found.
            </div>
          ) : (
            shops.map((shop) => {
              const isSelected = shop.id === selectedShopId;
              return (
                <article
                  key={shop.id}
                  className={`rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-50 shadow-md'
                      : 'border-zinc-200 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedShopId(shop.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[#191c1c] leading-snug break-words">{shop.name}</p>
                      {shop.distance && (
                        <p className="mt-0.5 text-xs text-[#72796e]">{shop.distance} away</p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${shopStatusBadgeClass(shop.status)}`}>
                      {shop.status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#72796e]">
                    <ShopRating shop={shop} />
                    {shop.isPartner && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">Partner</span>
                    )}
                  </div>

                  {(shop.materials || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {shop.materials.slice(0, 4).map((material) => (
                        <span key={material} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-[#42493e]">
                          {material}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedShopId(shop.id); }}
                    className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#154212] text-white hover:bg-emerald-800'
                    }`}
                  >
                    <MapPin size={12} />
                    {isSelected ? 'Showing on map' : 'Show on map'}
                  </button>
                </article>
              );
            })
          )}
        </div>
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
