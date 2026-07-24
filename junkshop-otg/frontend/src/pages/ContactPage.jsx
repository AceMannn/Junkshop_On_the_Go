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
import {
  siteContainerClass,
  siteHeroGradientClass,
  siteInputClass,
  sitePageClass,
} from '../components/ui/siteUi';
import Reveal from '../components/ui/Reveal';
import CharCount from '../components/ui/CharCount';
import {
  clampText,
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_NAME_MAX,
} from '../utils/textLimits';

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
      "Use the map on this page or Home — or tap 'Browse partner shops' above.",
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
      "Use the quick links above or set Subject to 'Suggest a junkshop' and fill in the details.",
  },
];

const CONTACT_ROWS = [
  { icon: Mail, label: 'Email', value: 'hello@junkshop-otg.ph', href: 'mailto:hello@junkshop-otg.ph' },
  { icon: Facebook, label: 'Facebook', value: 'JunkShop On-The-Go Teresa', href: null },
  { icon: Phone, label: 'Phone', value: '0912 345 6789', href: 'tel:09123456789' },
  { icon: MapPin, label: 'Location', value: 'Teresa, Sta. Mesa, Manila', href: null },
];

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

export default function ContactPage() {
  const { shops, loading: shopsLoading, error: shopsError, refresh: refreshShops } = useCatalogJunkshops({
    autoRefresh: false,
    partnersOnly: true,
  });

  const subjectRef = useRef(null);
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

  return (
    <div className={`${sitePageClass} public-marketing pb-16`}>
      <section className={`${siteHeroGradientClass} px-4 pt-28 pb-8 sm:px-6 sm:pb-10 lg:px-8`}>
        <div className={`${siteContainerClass} max-w-5xl`}>
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--site-accent)]">
              Contact
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-[var(--site-text)]">
              Let&apos;s connect
            </h1>
            <p className="mt-2 max-w-xl text-base text-[var(--site-muted)] sm:text-lg">
              Reach platform support, browse partners, or report an issue — we typically reply in 1–2
              business days.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {HERO_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleHeroAction(pill)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--site-pill-border)] bg-[var(--site-pill-bg)] px-3 py-2 text-xs font-semibold text-[var(--site-accent)] transition hover:opacity-90 sm:px-4 sm:text-sm"
                >
                  <pill.icon size={15} />
                  {pill.label}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <div className={`${siteContainerClass} mt-8 max-w-5xl space-y-5 sm:mt-10`}>
        {/* One console panel — equal columns, shared height */}
        <Reveal>
          <div
            id="platform-support"
            className="scroll-mt-24 overflow-hidden rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[var(--site-card-shadow)]"
          >
            <div className="grid lg:grid-cols-2 lg:items-stretch">
              {/* Contact rail */}
              <aside className="flex flex-col border-b border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 sm:p-6 lg:border-b-0 lg:border-r">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--site-accent)]">
                  Reach us
                </p>
                <p className="mt-1 text-sm text-[var(--site-muted)]">
                  Direct channels for Teresa, Sta. Mesa support.
                </p>

                <div className="mt-6 flex flex-1 flex-col gap-1">
                  {CONTACT_ROWS.map((row) => {
                    const rowClass =
                      'flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-[var(--site-hover)]';
                    const content = (
                      <>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--site-pill-bg)]">
                          <row.icon size={16} className="text-[var(--site-accent)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wide text-[var(--site-muted)]">
                            {row.label}
                          </p>
                          <p className="truncate text-sm font-semibold text-[var(--site-text)]">
                            {row.value}
                          </p>
                        </div>
                      </>
                    );

                    if (row.href) {
                      return (
                        <a key={row.label} href={row.href} className={rowClass}>
                          {content}
                        </a>
                      );
                    }

                    return (
                      <div key={row.label} className={rowClass}>
                        {content}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 border-t border-[var(--site-border)] pt-4">
                  <p className="text-xs leading-relaxed text-[var(--site-muted)]">
                    Typical reply:{' '}
                    <span className="font-semibold text-[var(--site-text)]">1–2 business days</span>.
                    For shop-specific questions, use the partner phone numbers below.
                  </p>
                </div>
              </aside>

              {/* Form pane */}
              <div className="flex flex-col p-5 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--site-accent)]">
                  Send a message
                </p>
                <p className="mt-1 mb-5 text-xs text-[var(--site-muted)]">
                  Platform support only — messages go to our team, not individual junkshops.
                </p>

                {isSubmitted ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--site-brand-deep)]">
                      <Send className="text-[var(--site-btn-text)]" size={26} />
                    </div>
                    <h3 className="mb-2 text-[var(--site-accent)]">Message sent!</h3>
                    <p className="text-sm text-[var(--site-muted)]">
                      Thank you — our team will review your message soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-1 flex-col space-y-4">
                    {error && (
                      <div className="rounded-lg border border-[var(--site-danger-border)] bg-[var(--site-danger-bg)] p-3 text-sm text-[var(--site-danger-text)]">
                        {error}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="firstName" className="mb-1 block text-xs font-medium text-[var(--site-muted)]">
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
                          className={siteInputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="mb-1 block text-xs font-medium text-[var(--site-muted)]">
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
                          className={siteInputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-1 block text-xs font-medium text-[var(--site-muted)]">
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
                        className={siteInputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="mb-1 block text-xs font-medium text-[var(--site-muted)]">
                        Subject
                      </label>
                      <select
                        ref={subjectRef}
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className={siteInputClass}
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
                    <div className="flex flex-1 flex-col">
                      <label htmlFor="message" className="mb-1 block text-xs font-medium text-[var(--site-muted)]">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        maxLength={CONTACT_MESSAGE_MAX}
                        placeholder="Tell us what's on your mind…"
                        className={`${siteInputClass} min-h-[7rem] flex-1 resize-y`}
                      />
                      <CharCount
                        value={formData.message}
                        max={CONTACT_MESSAGE_MAX}
                        min={CONTACT_MESSAGE_MIN}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--site-btn)] px-4 text-sm font-semibold text-[var(--site-btn-text)] transition hover:bg-[var(--site-btn-hover)] disabled:opacity-60"
                    >
                      <Send size={14} />
                      {isSubmitting ? 'Sending…' : 'Send to platform support'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Full-width map band — desktop only; mobile uses partners card map tab */}
        <Reveal className="hidden lg:block">
          <div>
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--site-accent)]">
                Partner map
              </p>
              <p className="text-xs text-[var(--site-muted)]">Verified junkshops near Teresa</p>
            </div>
            {shopsLoading ? (
              <div className="flex min-h-[200px] items-center justify-center text-sm text-[var(--site-muted)]">
                Loading map…
              </div>
            ) : shops.length === 0 ? (
              <EmptyState
                compact
                icon={MapPin}
                title="No shops on the map yet"
                description="Partner pins appear once providers publish their shop."
              />
            ) : (
              <JunkshopsMap
                shops={shops}
                routingEnabled
                compactRoutingControls
                className="min-h-[220px]"
              />
            )}
          </div>
        </Reveal>

        {/* Partners + FAQ — equal columns */}
        <div id="partner-preview" className="grid scroll-mt-24 gap-5 lg:grid-cols-2 lg:items-stretch">
          <Reveal className="h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[var(--site-card-shadow)] sm:p-6">
              <div className="mb-4 flex border-b border-[var(--site-border)]">
                {['partners', 'map'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 pb-3 text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-[var(--site-accent)] font-medium text-[var(--site-accent)]'
                        : 'text-[var(--site-muted)] hover:text-[var(--site-text)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {shopsError && (
                <LoadErrorBanner message={shopsError} onRetry={refreshShops} className="mb-3" />
              )}

              {activeTab === 'partners' ? (
                <div className="space-y-2">
                  {shopsLoading ? (
                    <p className="text-sm text-[var(--site-muted)]">Loading partners…</p>
                  ) : previewShops.length === 0 ? (
                    <EmptyState
                      compact
                      icon={Store}
                      title="No partners yet"
                      description="Verified junkshops appear here once providers finish setup."
                    />
                  ) : (
                    previewShops.map((shop) => (
                      <div
                        key={shop.id}
                        className="flex items-center gap-3 rounded-lg border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-3 py-2.5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--site-pill-bg)] text-[13px] font-semibold text-[var(--site-accent)]">
                          {getShopInitials(shop.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-[var(--site-text)]">{shop.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--site-muted)]">
                            <span>{shortenAddress(shop.address)}</span>
                            <ShopRating shop={shop} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {shopsLoading ? (
                    <p className="text-sm text-[var(--site-muted)]">Loading map…</p>
                  ) : shops.length === 0 ? (
                    <EmptyState
                      compact
                      icon={MapPin}
                      title="No shops on the map yet"
                      description="Partner pins appear once providers publish their shop."
                    />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-[var(--site-border)]">
                      <JunkshopsMap
                        shops={shops}
                        routingEnabled
                        compactRoutingControls
                        className="fluid-map-min-height min-h-[260px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.06} className="h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[var(--site-card-shadow)] sm:p-6">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[var(--site-accent)]">
                Common questions
              </p>
              <div className="flex-1">
                {FAQ_ITEMS.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={item.question}
                      className={index < FAQ_ITEMS.length - 1 ? 'border-b border-[var(--site-border)]' : ''}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="flex w-full items-center justify-between gap-3 py-3 text-left text-[13px] font-medium text-[var(--site-text)]"
                      >
                        {item.question}
                        <ChevronDown
                          size={14}
                          className={`shrink-0 text-[var(--site-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <p className="pb-3 text-xs leading-relaxed text-[var(--site-muted)]">{item.answer}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
