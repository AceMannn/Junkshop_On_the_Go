import { useRef, useState } from 'react';
import {
  Mail,
  Facebook,
  MapPin,
  Phone,
  Send,
  MessageCircle,
  Store,
  Flag,
  ChevronDown,
} from 'lucide-react';
import { contactApi } from '../services/api';
import JunkshopsMap from '../components/maps/JunkshopsMap';
import { useCatalogJunkshops } from '../hooks/useCatalogData';
import LoadErrorBanner from '../components/ui/LoadErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import ShopRating from '../components/ui/ShopRating';
import { siteCardClass, siteContainerClass, siteHeroGradientClass, siteInputClass, sitePageClass, siteBtnPrimaryClass } from '../components/ui/siteUi';
import CharCount from '../components/ui/CharCount';
import {
  clampText,
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_NAME_MAX,
} from '../utils/textLimits';

const AVATAR_STYLES = [
  'bg-emerald-50 text-emerald-700',
  'bg-blue-50 text-blue-700',
  'bg-amber-50 text-amber-700',
];

const HERO_PILLS = [
  { id: 'browse', label: 'Browse partner shops', icon: Store, subject: null },
  { id: 'suggest', label: 'Suggest a junkshop', icon: MessageCircle, subject: 'Junkshop suggestion' },
  { id: 'report', label: 'Report an issue', icon: Flag, subject: 'Issue report' },
];

const SUBJECT_OPTIONS = [
  'General question',
  'Junkshop suggestion',
  'Issue report',
  'Feedback',
];

const FAQ_ITEMS = [
  {
    question: 'How do I find the nearest junkshop?',
    answer:
      "Use the Partners or Map tab below — or tap 'Browse partner shops' in the banner above.",
  },
  {
    question: 'What materials can I recycle?',
    answer:
      'Check the homepage price guide for accepted materials — metals, electronics, paper, and plastics are generally accepted.',
  },
  {
    question: 'How are prices determined?',
    answer:
      'Partners set their own rates. The price guide shows current averages. Prices may vary by area and material condition.',
  },
  {
    question: 'How do I suggest a new junkshop?',
    answer:
      "Use the Quick Links above or set Subject in the contact form to 'Suggest a junkshop' and fill in the details.",
  },
];

const CONTACT_ROWS = [
  { icon: Mail, label: 'Email', value: 'hello@junkshop-otg.ph', href: 'mailto:hello@junkshop-otg.ph' },
  { icon: Facebook, label: 'Facebook', value: 'JunkShop On-The-Go Teresa', href: '#' },
  { icon: Phone, label: 'Phone', value: '0912 345 6789', href: 'tel:09123456789' },
  { icon: MapPin, label: 'Location', value: 'Teresa, Sta. Mesa, Manila', href: null },
];

const inputClass = siteInputClass;

function ContactCard({ children, className = '', id }) {
  return (
    <div id={id} className={`${siteCardClass} p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-4">{children}</p>
  );
}

function getShopInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function shortenAddress(address = '') {
  if (!address) return 'Location not listed';
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 2) return address;
  return parts.slice(-2).join(', ');
}

function PartnerPreviewRow({ shop, index }) {
  const avatarStyle = AVATAR_STYLES[index % AVATAR_STYLES.length];

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${avatarStyle}`}
      >
        {getShopInitials(shop.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-medium text-charcoal truncate">{shop.name}</p>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            Verified
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} className="shrink-0" />
            {shortenAddress(shop.address)}
          </span>
          <ShopRating shop={shop} />
        </div>
      </div>
      <p className="hidden sm:block shrink-0 text-[11px] text-gray-500">
        {shop.phone || '—'}
      </p>
    </div>
  );
}

export default function ContactPage() {
  const { shops, loading: shopsLoading, error: shopsError, refresh: refreshShops } = useCatalogJunkshops({
    autoRefresh: false,
    partnersOnly: true,
  });

  const subjectRef = useRef(null);
  const tabsRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: 'General question',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('partners');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const previewShops = shops.slice(0, 3);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openSupportForm = (subject) => {
    if (subject) {
      setFormData((prev) => ({ ...prev, subject }));
    }
    setIsSubmitted(false);
    scrollToSection('platform-support');
    window.setTimeout(() => subjectRef.current?.focus(), 400);
  };

  const handleHeroAction = (item) => {
    if (item.id === 'browse') {
      scrollToSection('partner-preview');
      setActiveTab('partners');
      return;
    }
    openSupportForm(item.subject);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.message.trim().length < CONTACT_MESSAGE_MIN) {
      setError(`Message must be at least ${CONTACT_MESSAGE_MIN} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await contactApi.sendMessage(formData);
      setIsSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        subject: 'General question',
        message: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const limits = {
      firstName: CONTACT_NAME_MAX,
      lastName: CONTACT_NAME_MAX,
      email: CONTACT_EMAIL_MAX,
      message: CONTACT_MESSAGE_MAX,
    };
    const nextValue = limits[name] ? clampText(value, limits[name]) : value;
    setFormData({ ...formData, [name]: nextValue });
    setError('');
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex((current) => (current === index ? null : index));
  };

  return (
    <div className={`${sitePageClass} pb-16`}>
      <section className={`${siteHeroGradientClass} px-4 pt-28 pb-8 sm:px-6 lg:px-8`}>
        <div className={`${siteContainerClass} max-w-5xl`}>
          <div className="rounded-2xl border border-emerald-200/60 bg-white/90 backdrop-blur-sm px-6 py-10 text-center sm:px-10 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              JunkShop On-The-Go
            </p>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-[#191c1c]">Let&apos;s connect</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-[#72796e]">
              Browse verified partners, share feedback, or reach our team.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {HERO_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleHeroAction(pill)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs sm:text-sm font-semibold text-[#154212] transition-colors hover:bg-emerald-100 sm:px-4"
                >
                  <pill.icon size={15} />
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
        {/* Section 2 — Contact info + form */}
        <div className="grid gap-4 md:grid-cols-2">
          <ContactCard>
            <SectionLabel>Contact info</SectionLabel>
            <div className="space-y-4">
              {CONTACT_ROWS.map((row) => {
                const content = (
                  <>
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <row.icon size={16} className="text-eco-green" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-500">{row.label}</p>
                      <p className="text-[13px] font-medium text-charcoal">{row.value}</p>
                    </div>
                  </>
                );

                if (row.href) {
                  return (
                    <a key={row.label} href={row.href} className="flex items-start gap-3 hover:opacity-80">
                      {content}
                    </a>
                  );
                }

                return (
                  <div key={row.label} className="flex items-start gap-3">
                    {content}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 border-t border-gray-200 pt-5">
              <SectionLabel>Response time</SectionLabel>
              <p className="text-xs leading-relaxed text-gray-500">
                We typically reply within{' '}
                <span className="font-medium text-charcoal">1–2 business days</span>. For
                junkshop-specific questions, contact them directly using their phone number in the
                directory.
              </p>
            </div>
          </ContactCard>

          <ContactCard id="platform-support" className="scroll-mt-24">
            <SectionLabel>Send a message</SectionLabel>
            <p className="mb-4 text-xs text-gray-500">
              Platform support only — messages are stored in our database, not sent to individual
              junkshops.
            </p>

            {isSubmitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#154212]">
                  <Send className="text-white" size={26} />
                </div>
                <h3 className="mb-2 text-eco-green">Message sent!</h3>
                <p className="text-sm text-gray-600">Thank you — our team will review your message soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-1 block text-xs font-medium text-gray-600">
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      maxLength={CONTACT_NAME_MAX}
                      placeholder="Juan"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="mb-1 block text-xs font-medium text-gray-600">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      maxLength={CONTACT_NAME_MAX}
                      placeholder="Dela Cruz"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-600">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    maxLength={CONTACT_EMAIL_MAX}
                    placeholder="juan@email.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="mb-1 block text-xs font-medium text-gray-600">
                    Subject
                  </label>
                  <select
                    ref={subjectRef}
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    {SUBJECT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option === 'Junkshop suggestion'
                          ? 'Suggest a junkshop'
                          : option === 'Issue report'
                            ? 'Report an issue'
                            : option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="mb-1 block text-xs font-medium text-gray-600">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    maxLength={CONTACT_MESSAGE_MAX}
                    placeholder="Tell us what's on your mind…"
                    className={`${inputClass} min-h-[80px] resize-y`}
                  />
                  <CharCount
                    value={formData.message}
                    max={CONTACT_MESSAGE_MAX}
                    min={CONTACT_MESSAGE_MIN}
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#154212] px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
                  >
                    <Send size={13} />
                    {isSubmitting ? 'Sending…' : 'Send to platform support'}
                  </button>
                </div>
              </form>
            )}
          </ContactCard>
        </div>

        {/* Section 3 — Tabs + FAQ */}
        <div id="partner-preview" ref={tabsRef} className="grid gap-4 scroll-mt-24 md:grid-cols-2">
          <ContactCard>
            <div className="mb-4 flex border-b border-gray-200">
              {['partners', 'map'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 pb-3 text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-eco-green font-medium text-eco-green'
                      : 'text-gray-500 hover:text-charcoal'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {shopsError && (
              <LoadErrorBanner
                message={shopsError}
                onRetry={refreshShops}
                className="mb-3"
              />
            )}

            {activeTab === 'partners' ? (
              <div className="space-y-2">
                {shopsLoading ? (
                  <p className="text-sm text-gray-500">Loading partners…</p>
                ) : previewShops.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Store}
                    title="No partners yet"
                    description="Verified junkshops appear here once providers finish setup."
                  />
                ) : (
                  previewShops.map((shop, index) => (
                    <PartnerPreviewRow key={shop.id} shop={shop} index={index} />
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {shopsLoading ? (
                  <p className="text-sm text-gray-500">Loading map…</p>
                ) : shops.length === 0 ? (
                  <EmptyState
                    compact
                    icon={MapPin}
                    title="No shops on the map yet"
                    description="Partner pins appear once providers publish their shop."
                  />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <JunkshopsMap
                      shops={shops}
                      routingEnabled
                      compactRoutingControls
                      className="min-h-[220px]"
                    />
                  </div>
                )}
                <p className="text-[11px] text-gray-500">
                  Verified partner junkshops in Metro Manila and nearby areas.
                </p>
              </div>
            )}
          </ContactCard>

          <ContactCard>
            <SectionLabel>Common questions</SectionLabel>
            <div>
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={item.question}
                    className={index < FAQ_ITEMS.length - 1 ? 'border-b border-gray-200' : ''}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left text-[13px] font-medium text-charcoal"
                    >
                      {item.question}
                      <ChevronDown
                        size={14}
                        className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <p className="pb-3 text-xs leading-relaxed text-gray-500">{item.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </ContactCard>
        </div>
      </div>
    </div>
  );
}
