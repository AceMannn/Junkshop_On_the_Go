import { useMemo, useState } from 'react';
import { MapPin, Package, Recycle, Smartphone, ShoppingBag, Store } from 'lucide-react';
import garbageCollector from '../assets/garbage_collector.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Modal } from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import JunkshopsMap from '../components/maps/JunkshopsMap';
import ShopRating from '../components/ui/ShopRating';
import { useCatalogJunkshops, useFeaturedMaterials } from '../hooks/useCatalogData';
import { priceCategories } from '../data/prices';
import {
  materialGuides,
  previewRecyclingSteps,
  recyclingDonts,
  recyclingDos,
  recyclingSteps,
} from '../data/recyclingGuide';

const categoryIcons = {
  plastic: Recycle,
  paper: Package,
  metal: Package,
  glass: Recycle,
  ewaste: Smartphone,
};

export default function HomePage() {
  const [activeModal, setActiveModal] = useState(null);
  const { shops, loading: shopsLoading } = useCatalogJunkshops({
    autoRefresh: false,
    partnersOnly: true,
  });
  const { materials, loading: materialsLoading } = useFeaturedMaterials({ autoRefresh: false });

  const previewShops = useMemo(() => shops.slice(0, 3), [shops]);

  const previewMaterialCards = useMemo(() => materials.slice(0, 6), [materials]);
  const catalogMaterials = materials;

  const closeModal = () => setActiveModal(null);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f3fbf4] via-white to-[#e8f7ec] bg-[radial-gradient(circle_at_10px_10px,rgba(61,163,93,0.08)_3px,transparent_0)] bg-[size:24px_24px]">
        <div className="absolute top-10 right-10 w-32 h-32 bg-leaf-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-eco-green/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="mb-6">
                Recycle Smarter, <span className="text-eco-green">Earn More.</span>
              </h1>
              <p className="text-xl text-gray-600">
                Identify recyclables, know their value, and find junkshops in Teresa,
                Sta. Mesa, Manila.
              </p>
            </div>
            <div className="relative">
              <ImageWithFallback
                src={garbageCollector}
                alt="Garbage collector"
                className="rounded-[24px] shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-[#f8fcf8] via-white to-[#f2faf4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="What Can You Recycle?" description="Popular recyclable materials in your area" />
          {materialsLoading ? (
            <p className="text-center text-gray-500">Loading prices...</p>
          ) : previewMaterialCards.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No price data yet"
              description="Live partner prices appear when verified shops publish materials. Run npm run seed for reference catalog prices in areas still onboarding."
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {previewMaterialCards.map((item) => {
                const Icon = categoryIcons[item.category] || ShoppingBag;
                return (
                  <article key={item.id} className="bg-white rounded-[24px] p-5 shadow-md border border-gray-100 transition-all duration-200 hover:-translate-y-2">
                    <div className="flex h-32 mb-4 rounded-[18px] bg-emerald-50 items-center justify-center">
                      <Icon className="text-eco-green" size={40} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="mb-1">{item.material}</h4>
                        <div className="inline-block bg-sunny-yellow px-3 py-1 rounded-lg">
                          <span className="font-semibold text-charcoal">{item.perKgPrice}/kg</span>
                        </div>
                      </div>
                      <Icon className="text-eco-green shrink-0" size={28} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <SectionAction onClick={() => setActiveModal('prices')}>View all recyclables</SectionAction>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Find Junkshops Near You" description="Discover trusted junkshops in Teresa, Sta. Mesa with local pricing and community ratings." />
          <div className="bg-[#f9faf9] rounded-[28px] shadow-lg overflow-hidden border border-gray-100">
            <div className="grid lg:grid-cols-2">
              <div className="p-6 sm:p-8 bg-white">
                <div className="space-y-8">
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
                      <article key={shop.id} className="flex gap-4 items-start">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-10 h-10 rounded-full bg-eco-green flex items-center justify-center shadow-md">
                            <MapPin className="text-white" size={18} />
                          </div>
                          {index !== previewShops.length - 1 && <div className="w-[2px] h-16 bg-gray-200 mt-2 rounded-full" />}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-2 text-charcoal">{shop.name}</h4>
                          <p className="text-gray-600 text-base mb-2">
                            {shop.address}, <span className="text-gray-700">{shop.distance}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <ShopRating shop={shop} />
                            <span className={shop.status === 'Open' ? 'text-eco-green' : 'text-gray-500'}>{shop.status}</span>
                            <span className="text-gray-600">{shop.topPrice}</span>
                            {shop.isPartner && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Partner</span>
                            )}
                          </div>
                          {shop.latestReview && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                              "{shop.latestReview.comment || 'No written comment.'}" - {shop.latestReview.customerName}
                            </p>
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
              <div className="relative min-h-[320px] lg:min-h-full bg-eco-green p-6 sm:p-8 flex items-center justify-center">
                {shopsLoading ? (
                  <p className="text-sm text-white/80 animate-pulse">Loading map…</p>
                ) : previewShops.length === 0 ? (
                  <EmptyState
                    compact
                    inverted
                    icon={MapPin}
                    title="No shop locations yet"
                    description="Partner shops appear here on the map after providers complete setup."
                    className="w-full"
                  />
                ) : (
                  <JunkshopsMap shops={previewShops} className="h-full w-full" />
                )}
              </div>
            </div>
          </div>
          <SectionAction variant="outline" onClick={() => setActiveModal('map')}>Open full map</SectionAction>
        </div>
      </section>

      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#eef9f1] via-white to-[#f4fbf5]">
        <div className="absolute top-10 left-10 w-40 h-40 bg-eco-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-leaf-green/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader title="Quick Recycling Tips" description="Follow these simple steps to prepare your recyclables properly before bringing them to a junkshop." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {previewRecyclingSteps.map((step) => (
              <article
                key={step.number}
                className="bg-white rounded-[24px] overflow-hidden text-center shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
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
          <SectionAction variant="dark" onClick={() => setActiveModal('guide')}>View full guide</SectionAction>
        </div>
      </section>

      <PricesModal isOpen={activeModal === 'prices'} onClose={closeModal} materials={catalogMaterials} />
      <MapModal isOpen={activeModal === 'map'} onClose={closeModal} shops={shops} />
      <GuideModal isOpen={activeModal === 'guide'} onClose={closeModal} />
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="text-center mb-12">
      <h2 className="mb-4">{title}</h2>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">{description}</p>
    </div>
  );
}

function SectionAction({ children, onClick, variant = 'primary' }) {
  const variants = {
    primary: 'bg-eco-green text-white hover:bg-[#358F52]',
    outline: 'border-2 border-eco-green bg-white text-eco-green hover:bg-eco-green hover:text-white',
    dark: 'bg-charcoal text-white hover:bg-eco-green',
  };
  return (
    <div className="mt-10 text-center">
      <button type="button" onClick={onClick} className={`inline-flex items-center justify-center rounded-[12px] px-6 py-3 font-semibold shadow-md transition-all ${variants[variant]}`}>
        {children}
      </button>
    </div>
  );
}

function PricesModal({ isOpen, onClose, materials }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recyclable Materials Price Guide" description="Reference prices for Teresa, Sta. Mesa. Actual prices may vary by junkshop and item condition.">
      <div className="space-y-8">
        {priceCategories.filter((category) => category.id !== 'all').map((category) => {
          const categoryPrices = materials.filter((item) => item.category === category.id);
          if (categoryPrices.length === 0) return null;
          return (
            <section key={category.id}>
              <h3 className="mb-4 capitalize text-eco-green">{category.label}</h3>
              <div className="overflow-x-auto rounded-[16px] border border-gray-100">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-light-gray text-sm text-charcoal">
                    <tr>
                      <th className="px-4 py-3">Material</th>
                      <th className="px-4 py-3">Examples</th>
                      <th className="px-4 py-3">Per kg</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categoryPrices.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-3 font-semibold text-charcoal">{item.material}</td>
                        <td className="px-4 py-3 text-gray-600">{item.examples || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-eco-green">{item.perKgPrice}</td>
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
    <Modal isOpen={isOpen} onClose={onClose} title="Junkshops in Teresa, Sta. Mesa" description="Live junkshop pins from our database. Partner shops support in-app pickups." size="fullscreen">
      <div className="grid h-full gap-5 lg:grid-cols-[1fr_22rem]">
        <JunkshopsMap shops={shops} className="min-h-[420px]" />
        <div className="space-y-4 overflow-y-auto pr-1">
          {shops.map((shop) => (
            <article key={shop.id} className="rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-charcoal">{shop.name}</h4>
                  <p className="mt-1 text-sm text-gray-600">{shop.address}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shop.status === 'Open' ? 'bg-eco-green/10 text-eco-green' : 'bg-gray-100 text-gray-500'}`}>{shop.status}</span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  {shop.distance} away · <ShopRating shop={shop} />
                </p>
                <p>{shop.hours}</p>
                <p>{shop.phone}</p>
                <p className="font-semibold text-charcoal">{shop.topPrice}</p>
                {shop.latestReview && (
                  <p className="text-xs text-gray-600">
                    Latest: "{shop.latestReview.comment || 'No written comment.'}" - {shop.latestReview.customerName}
                  </p>
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
      </div>
    </Modal>
  );
}

function GuideModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Full Recycling Guide" description="Prepare recyclables correctly so junkshops can price them faster and contamination stays low.">
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
