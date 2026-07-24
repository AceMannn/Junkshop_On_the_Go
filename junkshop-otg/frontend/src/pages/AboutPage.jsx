import { useState } from 'react';
import { ChevronDown, Heart, Recycle, Users } from 'lucide-react';
import SiteButton from '../components/ui/SiteButton';
import Reveal, { RevealItem, RevealStagger } from '../components/ui/Reveal';
import CountUp from '../components/ui/CountUp';
import {
  siteContainerClass,
  siteHeroGradientClass,
  sitePageClass,
  siteSectionPadClass,
} from '../components/ui/siteUi';

const STORY_STEPS = [
  {
    id: 'problem',
    label: 'The gap',
    title: 'Scrap value stays hidden',
    body: 'Residents in Teresa, Sta. Mesa often lack clear prices, trusted junkshop locations, and simple guidance — so recyclables get wasted and income is missed.',
    points: [
      'Hard to know what scrap is worth',
      'Difficulty finding nearby junkshops',
      'No shared local price reference',
    ],
  },
  {
    id: 'solution',
    label: 'Our answer',
    title: 'One community platform',
    body: 'JunkShop On-The-Go connects residents to verified junkshops with maps, price guidance, and pickup or drop-off flows — so recycling is practical and rewarding.',
    points: [
      'Local price guide for recyclables',
      'Interactive junkshop locator',
      'Pickup and drop-off support',
    ],
  },
];

const THEORY_ITEMS = [
  {
    title: 'Environmental Education Theory',
    body: 'Accessible information builds knowledge, skills, and attitudes that lead to better recycling habits.',
  },
  {
    title: 'Community-Based Systems Theory',
    body: 'Local shops, residents, and shared data work as one system — livelihoods and cleaner streets move together.',
  },
];

export default function AboutPage({ onNavigate }) {
  const [openTheory, setOpenTheory] = useState(0);

  return (
    <div className={`${sitePageClass} public-marketing`}>
      <section className={`${siteHeroGradientClass} pt-28 pb-16 sm:pt-32 sm:pb-20`}>
        <div className={`${siteContainerClass} max-w-4xl`}>
          <Reveal>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--site-accent)]">
              Our story
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[var(--site-text)]">
              Building a greener Teresa, Sta. Mesa
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--site-muted)] sm:text-xl">
              A community platform where scrap has a clear path — from household bins to verified
              junkshops, with fairer information for everyone.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Narrative path — not twin cards */}
      <section className={`${siteSectionPadClass} bg-[var(--site-surface-alt)]`}>
        <div className={siteContainerClass}>
          <div className="relative space-y-0">
            <div className="absolute bottom-0 left-[1.15rem] top-0 hidden w-px bg-[var(--site-border)] sm:block" />
            {STORY_STEPS.map((step, index) => (
              <Reveal key={step.id} delay={index * 0.06} className="relative grid gap-4 py-8 sm:grid-cols-[2.5rem_1fr] sm:gap-8">
                <div className="relative z-10 hidden sm:flex">
                  <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--site-pill-border)] bg-[var(--site-pill-bg)] text-xs font-bold text-[var(--site-accent)]">
                    {index + 1}
                  </span>
                </div>
                <div className="max-w-3xl border-l-2 border-[var(--site-accent)] pl-5 sm:border-l-0 sm:pl-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--site-accent)]">
                    {step.label}
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-[var(--site-text)]">
                    {step.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-[var(--site-muted)]">{step.body}</p>
                  <ul className="mt-5 space-y-2">
                    {step.points.map((point) => (
                      <li key={point} className="flex gap-2 text-sm text-[var(--site-body)]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--site-accent)]" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Impact metrics */}
      <section className={`${siteSectionPadClass} site-page-bg`}>
        <div className={siteContainerClass}>
          <Reveal className="mb-10 max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--site-accent)]">
              Impact focus
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[var(--site-text)]">
              What we aim to grow
            </h2>
          </Reveal>

          <RevealStagger className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: Users, label: 'Households informed', value: 500, suffix: '+' },
              { icon: Recycle, label: 'Material categories', value: 6, suffix: '' },
              { icon: Heart, label: 'Community partners', value: 12, suffix: '+' },
            ].map((item) => (
              <RevealItem key={item.label}>
                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[var(--site-card-shadow)]">
                  <item.icon className="text-[var(--site-accent)]" size={22} />
                  <p className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--site-text)]">
                    <CountUp value={item.value} suffix={item.suffix} />
                  </p>
                  <p className="mt-2 text-sm text-[var(--site-muted)]">{item.label}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Research accordion */}
      <section className={`${siteSectionPadClass} bg-[var(--site-surface-alt)]`}>
        <div className={`${siteContainerClass} max-w-3xl`}>
          <Reveal className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--site-accent)]">
              Research
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[var(--site-text)]">
              Foundations we build on
            </h2>
          </Reveal>

          <div className="divide-y divide-[var(--site-border)] overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)]">
            {THEORY_ITEMS.map((item, index) => {
              const open = openTheory === index;
              return (
                <div key={item.title}>
                  <button
                    type="button"
                    onClick={() => setOpenTheory(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-[var(--site-text)]">{item.title}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[var(--site-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {open && (
                    <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--site-muted)]">{item.body}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--site-border)] bg-[var(--site-footer-bg)] py-16 text-[var(--site-footer-text)] sm:py-20">
        <div className={`${siteContainerClass} max-w-3xl text-center`}>
          <Reveal variant="fade">
            <h2 className="font-[family-name:var(--font-display)] text-[var(--site-footer-text)]">
              Join the community initiative
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--site-muted)]">
              Help Teresa recycle with clearer prices and trusted local shops.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <SiteButton variant="primary" onClick={() => onNavigate('contact')}>
                Get involved
              </SiteButton>
              <SiteButton
                variant="outline"
                className="border-[var(--site-footer-text)]/30 text-[var(--site-footer-text)] hover:bg-white/10"
                onClick={() => onNavigate('home')}
              >
                Back to home
              </SiteButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
