import { siteContainerClass, siteSectionPadClass } from '../ui/siteUi';

const CATEGORY_CARDS = [
  {
    id: 'plastic',
    label: 'Plastic',
    description: 'Bottles, containers, bags, and hard plastic items accepted at most junkshops.',
    examples: 'PET bottles · Hard plastic · Plastic bags',
    image:
      'https://images.unsplash.com/photo-1558640476-437a2b9438a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFzdGljJTIwYm90dGxlJTIwcmVjeWNsaW5nfGVufDF8fHx8MTc2NTM4NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    priceHint: '₱5–₱30/kg',
  },
  {
    id: 'metal',
    label: 'Metal',
    description: 'Scrap iron, aluminum cans, copper wire, and brass fetch some of the highest prices.',
    examples: 'Scrap iron · Aluminum cans · Copper wire',
    image:
      'https://images.unsplash.com/photo-1625662276901-4a7ec44fbeed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY3JhcCUyMG1ldGFsJTIwcmVjeWNsaW5nfGVufDF8fHx8MTc2NTM4NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    priceHint: '₱35–₱350/kg',
  },
  {
    id: 'paper',
    label: 'Paper',
    description: 'Old newspapers, office paper, and cardboard boxes are all recyclable.',
    examples: 'Newspaper · Office paper · Cardboard',
    image:
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXBlciUyMHJlY3ljbGluZ3xlbnwxfHx8fDE3NjUzODU3MDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    priceHint: '₱5–₱15/kg',
  },
  {
    id: 'tires',
    label: 'Tires',
    description: 'Car, motorcycle, and bicycle tires — keep them dry and mud-free.',
    examples: 'Car tires · Motorcycle tires · Bicycle tires',
    image:
      'https://images.unsplash.com/photo-1580274455191-1c62238fa333?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aXJlJTIwc3RhY2t8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    priceHint: '₱5–₱20/piece',
  },
  {
    id: 'glass',
    label: 'Glass',
    description: 'Unbroken clear and colored glass bottles are accepted. Remove caps and labels.',
    examples: 'Clear bottles · Colored bottles · Glass jars',
    image:
      'https://images.unsplash.com/photo-1554208873-4292cf6c952d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMGJvdHRsZXMlMjByZWN5Y2xpbmd8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    priceHint: '₱6–₱12/kg',
  },
  {
    id: 'e-waste',
    label: 'E-waste',
    description: 'Old electronics, computer parts, mobile phones, and cables all have value.',
    examples: 'Computer parts · Mobile phones · Cables',
    image:
      'https://images.unsplash.com/photo-1728610996936-d93900f1886b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwd2FzdGV8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    priceHint: '₱50–₱800/kg',
  },
];

export default function MaterialMarketplaceSection() {
  return (
    <section className={`${siteSectionPadClass} site-page-bg`}>
      <div className={siteContainerClass}>
        <div className="text-center mb-10">
          <h2 className="mb-4">What Can You Recycle?</h2>
          <p className="text-xl text-[#72796e] max-w-3xl mx-auto">
            Hover over each category to learn what items are accepted and how much you can earn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORY_CARDS.map((card) => (
            <div
              key={card.id}
              className="group relative overflow-hidden rounded-2xl shadow-sm border border-zinc-200 cursor-default"
              style={{ aspectRatio: '4/3' }}
            >
              {/* Background image */}
              <img
                src={card.image}
                alt={card.label}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Always-visible dark gradient at bottom for the label */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Hover overlay — darkens the full card */}
              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Default label (always visible) */}
              <div className="absolute bottom-0 left-0 right-0 p-5 transition-all duration-300 group-hover:translate-y-2 group-hover:opacity-0">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Recyclable</p>
                <h3 className="text-xl font-bold text-white leading-tight">{card.label}</h3>
                <p className="text-sm font-semibold text-emerald-300 mt-0.5">{card.priceHint}</p>
              </div>

              {/* Hover content */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 translate-y-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                <h3 className="text-xl font-bold text-white mb-2">{card.label}</h3>
                <p className="text-sm text-white/90 leading-relaxed mb-3">{card.description}</p>
                <p className="text-xs font-semibold text-emerald-300 tracking-wide">{card.examples}</p>
                <p className="mt-2 text-sm font-bold text-emerald-300">{card.priceHint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
