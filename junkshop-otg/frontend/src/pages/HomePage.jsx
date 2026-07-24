import { useMemo, useState } from 'react';
import { ArrowRight, MapPin, Search, Store } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import JunkshopsMap from '../components/maps/JunkshopsMap';
import ShopRating from '../components/ui/ShopRating';
import { useCatalogJunkshops, useFeaturedMaterials } from '../hooks/useCatalogData';
import LoadErrorBanner from '../components/ui/LoadErrorBanner';
import MaterialsPriceRail from '../components/marketplace/MaterialsPriceRail';
import ScrapFlowAnimation from '../components/ui/ScrapFlowAnimation';
import CountUp from '../components/ui/CountUp';
import {
  materialGuides,
  recyclingDonts,
  recyclingDos,
  recyclingSteps,
} from '../data/recyclingGuide';
import { priceCategories } from '../data/prices';
import { shopStatusBadgeClass } from '../utils/catalogMappers';
import SiteButton from '../components/ui/SiteButton';
import Reveal, { RevealItem, RevealStagger } from '../components/ui/Reveal';
import {
  siteContainerClass,
  siteHeroGradientClass,
  siteSectionPadClass,
} from '../components/ui/siteUi';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Find a shop',
    body: 'Locate verified junkshops near Teresa, Sta. Mesa on the live map.',
  },
  {
    step: '02',
    title: 'Check prices',
    body: 'Compare scrap ranges for plastic, metal, paper, glass, tires, and e-waste.',
  },
  {
    step: '03',
    title: 'Sell or drop off',
    body: 'Book a pickup or bring materials in — get paid for what you recycle.',
  },
];

export default function HomePage({ onSignInToSell }) {
  const [activeModal, setActiveModal] = useState(null);
  const { shops, loading: shopsLoading, error: shopsError, refresh: refreshShops } = useCatalogJunkshops({
    autoRefresh: false,
    partnersOnly: true,
  });
  const { materials } = useFeaturedMaterials({ autoRefresh: false });

  const previewShops = useMemo(() => shops.slice(0, 4), [shops]);
  const catalogMaterials = materials;
  const materialCount = materials.length || 24;
  const shopCount = shops.length || 0;

  const closeModal = () => setActiveModal(null);
  const scrollToMap = () => {
    document.getElementById('home-map-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="site-page-bg public-marketing">
      {/* Hero */}
      <section className={`${siteHeroGradientClass} relative`}>
        <div className={`${siteContainerClass} relative z-10 grid items-center gap-10 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24`}>
          <Reveal>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--site-pill-border)] bg-[var(--site-pill-bg)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--site-accent)]">
              Teresa, Sta. Mesa · Community recycling
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[var(--site-text)]">
              Recycle smarter.
              <span className="block text-[var(--site-accent)]">Earn from scrap.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--site-muted)] sm:text-xl">
              Find trusted junkshops, check local scrap prices, and turn recyclables into income —
              built for Teresa, Sta. Mesa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SiteButton variant="primary" onClick={scrollToMap}>
                <Search size={16} />
                Find a shop
              </SiteButton>
              <SiteButton variant="outline" onClick={() => setActiveModal('prices')}>
                View prices
              </SiteButton>
            </div>
          </Reveal>

          <Reveal delay={0.1} variant="fade">
            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[var(--site-orb)] to-transparent blur-2xl pointer-events-none" />
              <ScrapFlowAnimation className="relative" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Live proof strip */}
      <section className="border-y border-[var(--site-border)] bg-[var(--site-surface)]">
        <div className={`${siteContainerClass} grid grid-cols-1 divide-y divide-[var(--site-border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0`}>
          {[
            { label: 'Partner junkshops', value: shopCount, suffix: shopCount === 0 ? '+' : '' },
            { label: 'Materials tracked', value: materialCount, suffix: '+' },
            { label: 'Community focus', value: 1, suffix: '', display: 'Teresa' },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-8 text-center sm:px-6">
              <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--site-text)] sm:text-4xl">
                {stat.display ? (
                  stat.display
                ) : (
                  <CountUp value={stat.value} suffix={stat.suffix} />
                )}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--site-muted)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <MaterialsPriceRail onViewAll={() => setActiveModal('prices')} />

      {/* Map stage */}
      <section id="home-map-stage" className={`${siteSectionPadClass} scroll-mt-24 bg-[var(--site-surface-alt)]`}>
        <div className={siteContainerClass}>
          <Reveal className="mb-8 max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--site-accent)]">
              Locate
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[var(--site-text)]">
              Junkshops on the map
            </h2>
            <p className="mt-3 text-base text-[var(--site-muted)] sm:text-lg">
              Explore verified partners nearby. Open the full map for directions and details.
            </p>
          </Reveal>

          {shopsError && (
            <LoadErrorBanner message={shopsError} onRetry={refreshShops} className="mb-4" />
          )}

          <Reveal>
            <div className="overflow-hidden rounded-[1.75rem] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[var(--site-card-shadow)]">
              <div className="grid lg:grid-cols-[18rem_1fr]">
                <div className="border-b border-[var(--site-border)] p-4 sm:p-5 lg:border-b-0 lg:border-r">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--site-muted)]">
                    Nearby partners
                  </p>
                  {shopsLoading ? (
                    <p className="text-sm text-[var(--site-muted)]">Loading shops…</p>
                  ) : previewShops.length === 0 ? (
                    <EmptyState
                      compact
                      icon={Store}
                      title="No partner shops yet"
                      description="Verified junkshops appear here once providers finish setup."
                    />
                  ) : (
                    <div className="space-y-2">
                      {previewShops.map((shop) => (
                        <div
                          key={shop.id}
                          className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-3 py-3"
                        >
                          <p className="truncate text-sm font-semibold text-[var(--site-text)]">{shop.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--site-muted)]">
                            <ShopRating shop={shop} />
                            <span>{shop.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative h-[18rem] bg-[var(--site-footer-bg)] sm:h-[22rem] lg:h-[26rem]">
                  {shopsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-[var(--site-muted)] animate-pulse">Loading map…</p>
                    </div>
                  ) : previewShops.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6">
                      <EmptyState
                        compact
                        inverted
                        icon={MapPin}
                        title="No shop locations yet"
                        description="Partner pins appear after providers publish their shop."
                      />
                    </div>
                  ) : (
                    <JunkshopsMap shops={previewShops} className="h-full w-full" fillContainer />
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-8 text-center">
            <SiteButton variant="outline" onClick={() => setActiveModal('map')}>
              Open full map
              <ArrowRight size={16} />
            </SiteButton>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className={`${siteSectionPadClass} site-page-bg`}>
        <div className={siteContainerClass}>
          <Reveal className="mb-10 max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--site-accent)]">
              How it works
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[var(--site-text)]">
              Three steps to sell scrap
            </h2>
          </Reveal>

          <RevealStagger className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, index) => (
              <RevealItem key={item.step}>
                <article className="relative h-full border-t-2 border-[var(--site-accent)] pt-6">
                  <p className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--site-accent)]/35">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-xl text-[var(--site-text)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--site-muted)]">{item.body}</p>
                  {index < HOW_IT_WORKS.length - 1 && (
                    <span className="pointer-events-none absolute -right-3 top-8 hidden text-[var(--site-border)] md:block">
                      →
                    </span>
                  )}
                </article>
              </RevealItem>
            ))}
          </RevealStagger>

          <Reveal className="mt-10 text-center">
            <SiteButton variant="ghost" onClick={() => setActiveModal('guide')}>
              Read the recycling guide
            </SiteButton>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--site-border)] bg-[var(--site-footer-bg)] py-16 text-[var(--site-footer-text)] sm:py-20">
        <div className={`${siteContainerClass} max-w-3xl text-center`}>
          <Reveal variant="fade">
            <h2 className="font-[family-name:var(--font-display)] text-[var(--site-footer-text)]">
              Ready to recycle with the community?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--site-muted)]">
              Create an account to book pickups, save favorite shops, and track your scrap history.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {onSignInToSell && (
                <SiteButton variant="primary" onClick={onSignInToSell}>
                  Login to start
                </SiteButton>
              )}
              <SiteButton
                variant="outline"
                className="border-[var(--site-footer-text)]/30 text-[var(--site-footer-text)] hover:bg-white/10"
                onClick={() => setActiveModal('map')}
              >
                Browse shops first
              </SiteButton>
            </div>
          </Reveal>
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
        <div className="order-2 min-h-[45vw] overflow-hidden md:order-1 md:h-full md:min-h-0">
          <JunkshopsMap
            shops={shops}
            selectedId={selectedShopId}
            onSelectShop={setSelectedShopId}
            className="h-full w-full"
            fillContainer
          />
        </div>

        <div className="order-1 flex max-h-[40vh] flex-col gap-3 overflow-y-auto border-l border-zinc-100 p-4 scroll-y-clean md:order-2 md:max-h-none">
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
                  className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-50 shadow-md'
                      : 'border-zinc-200 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedShopId(shop.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-bold leading-snug text-[#191c1c]">{shop.name}</p>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShopId(shop.id);
                    }}
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-eco-green text-lg font-bold text-white">
                    {step.number}
                  </div>
                  <div>
                    <h4>{step.title}</h4>
                    <p className="mt-1 text-gray-600">{step.description}</p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
                      {step.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
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
            <ul className="space-y-2 text-gray-700">
              {recyclingDos.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[18px] bg-red-50 p-5">
            <h3 className="mb-4 text-red-600">Don&apos;t</h3>
            <ul className="space-y-2 text-gray-700">
              {recyclingDonts.map((item) => (
                <li key={item}>× {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h3 className="mb-5 text-eco-green">Material Preparation</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {materialGuides.map((guide) => (
              <article key={guide.material} className="rounded-[18px] border border-gray-100 p-5">
                <h4>{guide.material}</h4>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-charcoal">Prep:</span> {guide.prep}
                </p>
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
