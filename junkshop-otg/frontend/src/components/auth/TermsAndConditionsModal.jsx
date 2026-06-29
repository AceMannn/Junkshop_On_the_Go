import { useState } from 'react';
import { X } from 'lucide-react';

const TERMS_COPY = {
  customer: {
    label: 'Customer',
    en: [
      {
        title: 'Customer account use',
        body: 'JunkShop On-The-Go lets customers find junkshops, check recyclable material prices, request pickups, arrange drop-offs, and view recycling history. You agree to use the platform only for valid recycling-related activities.',
      },
      {
        title: 'Accurate pickup and material details',
        body: 'You must provide correct contact details, address, map pin, schedule, and material information. Do not submit fake pickup requests, misleading material quantities, or photos that do not match the recyclable items.',
      },
      {
        title: 'Prices, payment, and transactions',
        body: 'Prices may vary per junkshop, material condition, weight, and availability. Final payment may change after the junkshop weighs and checks the materials. Transaction records may be kept for history, dispute review, and audit purposes.',
      },
      {
        title: 'Privacy and verification',
        body: 'The platform may collect your name, mobile number, email, address, map location, pickup history, photos, and account activity to provide services, send verification codes, prevent abuse, and support account recovery.',
      },
      {
        title: 'Security and account moderation',
        body: 'Accounts may be reviewed, suspended, banned, or soft-deleted when fraud, abuse, fake bookings, harassment, or policy violations are detected. Deleted records may remain in the database for safety, audit, and restoration purposes.',
      },
    ],
    tl: [
      {
        title: 'Paggamit ng customer account',
        body: 'Ang JunkShop On-The-Go ay tumutulong sa customers na maghanap ng junkshops, tumingin ng presyo ng recyclable materials, mag-request ng pickup, mag-arrange ng drop-off, at makita ang recycling history. Sumasang-ayon kang gamitin ito para lang sa tamang recycling-related activities.',
      },
      {
        title: 'Tamang pickup at material details',
        body: 'Dapat tama ang contact details, address, map pin, schedule, at impormasyon ng materials. Bawal ang pekeng pickup request, maling dami ng materials, o photos na hindi tugma sa recyclable items.',
      },
      {
        title: 'Presyo, bayad, at transaksyon',
        body: 'Maaaring magbago ang presyo depende sa junkshop, kondisyon ng materyales, timbang, at availability. Maaaring magbago ang final payment pagkatapos timbangin at suriin ng junkshop ang materials. Itinatago ang transaction records para sa history, dispute review, at audit.',
      },
      {
        title: 'Privacy at verification',
        body: 'Maaaring kolektahin ng platform ang pangalan, mobile number, email, address, map location, pickup history, photos, at account activity para maibigay ang serbisyo, makapagpadala ng verification codes, maiwasan ang abuse, at makatulong sa account recovery.',
      },
      {
        title: 'Security at account moderation',
        body: 'Maaaring ma-review, ma-suspend, ma-ban, o ma-soft delete ang account kapag may fraud, abuse, fake bookings, harassment, o paglabag sa rules. Ang deleted records ay maaaring manatili sa database para sa safety, audit, at restoration.',
      },
    ],
  },
  provider: {
    label: 'Junkshop Owner',
    en: [
      {
        title: 'Provider account use',
        body: 'Junkshop owner accounts are for legitimate junkshop operators who want to list accepted materials, manage pickups or drop-offs, update prices, and transact with customers through the platform.',
      },
      {
        title: 'Business accuracy and verification',
        body: 'You must provide accurate business name, owner name, mobile number, email when provided, address, map pin, operating hours, permits, identification, and shop photos. False documents or misleading business information may lead to rejection or account action.',
      },
      {
        title: 'Fair pricing and pickup responsibility',
        body: 'You agree to keep listed material prices, availability, and pickup details reasonably accurate. You must handle accepted pickup requests responsibly, communicate changes clearly, and record actual weight and payment truthfully.',
      },
      {
        title: 'Customer data and transaction records',
        body: 'Customer contact details, pickup locations, photos, payment details, and transaction logs must only be used for completing recycling services. Transaction records may be retained for reporting, dispute handling, audit logs, and admin review.',
      },
      {
        title: 'Security, moderation, and soft delete',
        body: 'Provider accounts and shop listings may be reviewed, suspended, banned, unpublished, or soft-deleted for fraud, unsafe conduct, fake pricing, invalid documents, abuse, or policy violations. Deleted records may be restored by admins when appropriate.',
      },
    ],
    tl: [
      {
        title: 'Paggamit ng provider account',
        body: 'Ang junkshop owner accounts ay para sa lehitimong junkshop operators na gustong mag-list ng accepted materials, mag-manage ng pickups o drop-offs, mag-update ng presyo, at makipag-transact sa customers gamit ang platform.',
      },
      {
        title: 'Tamang business info at verification',
        body: 'Dapat tama ang business name, owner name, mobile number, email kung meron, address, map pin, operating hours, permits, ID, at shop photos. Ang pekeng dokumento o maling business information ay maaaring magresulta sa rejection o account action.',
      },
      {
        title: 'Makatarungang presyo at pickup responsibility',
        body: 'Sumasang-ayon kang panatilihing tama ang listed material prices, availability, at pickup details. Dapat responsable ang pag-handle ng accepted pickup requests, malinaw ang communication sa changes, at totoo ang actual weight at payment records.',
      },
      {
        title: 'Customer data at transaction records',
        body: 'Ang customer contact details, pickup locations, photos, payment details, at transaction logs ay dapat gamitin lang para matapos ang recycling services. Maaaring itago ang transaction records para sa reporting, dispute handling, audit logs, at admin review.',
      },
      {
        title: 'Security, moderation, at soft delete',
        body: 'Maaaring ma-review, ma-suspend, ma-ban, ma-unpublish, o ma-soft delete ang provider accounts at shop listings dahil sa fraud, unsafe conduct, fake pricing, invalid documents, abuse, o paglabag sa rules. Maaaring i-restore ng admins ang deleted records kung nararapat.',
      },
    ],
  },
};

export const TERMS_VERSION = '2026-06-29';

export default function TermsAndConditionsModal({ isOpen, onClose, role = 'customer' }) {
  const [language, setLanguage] = useState('en');

  if (!isOpen) return null;

  const copy = TERMS_COPY[role] || TERMS_COPY.customer;
  const terms = copy[language] || copy.en;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
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
            <h2 id="terms-title" className="mt-1 text-xl font-bold text-charcoal">
              {copy.label} Terms and Conditions
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-charcoal/50 transition-colors hover:bg-zinc-100 hover:text-charcoal"
            aria-label="Close terms and conditions"
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

        <div className="scroll-y-clean flex-1 space-y-4 px-5 py-4">
          <p className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
            Please read this before creating your {copy.label.toLowerCase()} account. This starter
            version can be updated later with official school or legal wording.
          </p>
          {terms.map((item) => (
            <section key={item.title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <h3 className="font-bold text-charcoal">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{item.body}</p>
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
