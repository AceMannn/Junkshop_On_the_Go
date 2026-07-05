import { useState } from 'react';
import { X } from 'lucide-react';

const PRIVACY_COPY = {
  en: [
    {
      title: 'Information we collect',
      body: 'We may collect your name, email address, mobile number (when you add it in settings), account role, addresses, map locations, pickup and transaction history, uploaded photos, verification documents for junkshop owners, and technical logs needed to operate and secure the platform.',
    },
    {
      title: 'How we use your information',
      body: 'Data is used to create and manage accounts, verify identity, coordinate pickups and drop-offs, display shop listings, process transaction records, send verification and security messages, prevent fraud or abuse, and improve JunkShop On-The-Go services.',
    },
    {
      title: 'Sharing with other users',
      body: 'Customers may see provider business names, public shop contact numbers, addresses, map pins, material listings, and ratings. Providers may see customer contact details, pickup locations, material photos, and schedule information only as needed to complete a request.',
    },
    {
      title: 'Account security and recovery',
      body: 'Email is the primary login and verification method. If you add a mobile number in settings, it may be used later for account recovery, pickup coordination, and optional security features such as SMS codes when enabled.',
    },
    {
      title: 'Data retention and moderation',
      body: 'Transaction, audit, and deleted-record data may be retained for safety, dispute review, legal compliance, and admin moderation. Accounts may be suspended, banned, or soft-deleted when policy violations, fraud, or abuse are detected.',
    },
    {
      title: 'Your responsibilities',
      body: 'Provide accurate information, protect your password, and use the platform lawfully. Do not share another person’s data except as needed to complete legitimate recycling services on the platform.',
    },
    {
      title: 'Updates to this policy',
      body: 'We may update this Privacy Policy as the platform grows. Material changes may require renewed acceptance during signup or inside the app.',
    },
  ],
  tl: [
    {
      title: 'Impormasyong kinokolekta namin',
      body: 'Maaaring kolektahin namin ang pangalan, email, mobile number (kapag idinagdag mo sa settings), account role, address, map location, pickup at transaction history, uploaded photos, verification documents ng junkshop owners, at technical logs para mapatakbo at maprotektahan ang platform.',
    },
    {
      title: 'Paano namin ginagamit ang impormasyon',
      body: 'Ginagamit ang data para gumawa at mag-manage ng accounts, mag-verify ng identity, mag-coordinate ng pickups at drop-offs, magpakita ng shop listings, mag-process ng transaction records, magpadala ng verification at security messages, maiwasan ang fraud o abuse, at mapabuti ang serbisyo ng JunkShop On-The-Go.',
    },
    {
      title: 'Pagbabahagi sa ibang users',
      body: 'Maaaring makita ng customers ang business name ng provider, public shop contact number, address, map pin, material listings, at ratings. Maaaring makita ng providers ang contact details ng customer, pickup location, material photos, at schedule information kung kailangan lang para matapos ang request.',
    },
    {
      title: 'Account security at recovery',
      body: 'Email ang primary login at verification method. Kapag nagdagdag ka ng mobile number sa settings, maaari itong gamitin sa account recovery, pickup coordination, at optional security features tulad ng SMS codes kapag na-enable na.',
    },
    {
      title: 'Data retention at moderation',
      body: 'Maaaring itago ang transaction, audit, at deleted-record data para sa safety, dispute review, legal compliance, at admin moderation. Maaaring ma-suspend, ma-ban, o ma-soft delete ang account kapag may policy violations, fraud, o abuse.',
    },
    {
      title: 'Mga responsibilidad mo',
      body: 'Magbigay ng tamang impormasyon, protektahan ang password, at gamitin ang platform nang legal. Huwag ibahagi ang data ng ibang tao maliban kung kailangan para sa lehitimong recycling services sa platform.',
    },
    {
      title: 'Mga update sa policy na ito',
      body: 'Maaaring i-update ang Privacy Policy na ito habang lumalaki ang platform. Maaaring kailanganin ang renewed acceptance kapag may mahahalagang pagbabago.',
    },
  ],
};

export default function PrivacyPolicyModal({ isOpen, onClose }) {
  const [language, setLanguage] = useState('en');

  if (!isOpen) return null;

  const sections = PRIVACY_COPY[language] || PRIVACY_COPY.en;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              JunkShop On-The-Go
            </p>
            <h2 id="privacy-title" className="mt-1 text-xl font-bold text-charcoal">
              Privacy Policy
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-charcoal/50 transition-colors hover:bg-zinc-100 hover:text-charcoal"
            aria-label="Close privacy policy"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-zinc-100 px-5 py-3">
          <div className="inline-flex rounded-full bg-zinc-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-3 py-1.5 ${
                language === 'en' ? 'bg-white text-emerald-800 shadow-sm' : 'text-charcoal/60'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('tl')}
              className={`rounded-full px-3 py-1.5 ${
                language === 'tl' ? 'bg-white text-emerald-800 shadow-sm' : 'text-charcoal/60'
              }`}
            >
              Tagalog
            </button>
          </div>
        </div>

        <div className="scroll-y-clean flex-1 space-y-3 px-5 py-4">
          {sections.map((item) => (
            <section key={item.title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5">
              <h3 className="text-sm font-bold text-charcoal">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-charcoal/70">{item.body}</p>
            </section>
          ))}
        </div>

        <div className="border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#154212] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
          >
            Done reading
          </button>
        </div>
      </div>
    </div>
  );
}
