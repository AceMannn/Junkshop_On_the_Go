/** Shared public-site design tokens — values come from CSS vars (light/dark). */

export const siteColors = {
  bg: 'var(--site-bg)',
  surface: 'var(--site-surface)',
  surfaceAlt: 'var(--site-surface-alt)',
  text: 'var(--site-text)',
  muted: 'var(--site-muted)',
  body: 'var(--site-body)',
  border: 'var(--site-border)',
  brand: 'var(--site-brand)',
  accent: 'var(--site-accent)',
  brandDeep: 'var(--site-brand-deep)',
};

export const siteContainerClass = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

export const sitePageClass = 'min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]';

export const siteSectionPadClass = 'py-16 sm:py-20';

export const siteHeroGradientClass =
  'relative overflow-hidden site-hero-gradient';

export const siteCardClass =
  'min-w-0 overflow-hidden bg-[var(--site-surface)] rounded-2xl border border-[var(--site-border)] shadow-[var(--site-card-shadow)]';

export const siteCardHoverClass =
  'transition-all duration-300 hover:shadow-[var(--site-card-hover-shadow)] hover:-translate-y-0.5 hover:border-[var(--site-brand-deep)]';

export const siteInputClass =
  'w-full text-sm px-4 py-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-input-bg)] text-[var(--site-text)] placeholder:text-[var(--site-muted)]/70 outline-none transition focus:border-[var(--site-brand)] focus:ring-2 focus:ring-[var(--site-brand)]/25 disabled:opacity-60';

export const siteLabelClass =
  'block text-xs font-semibold uppercase tracking-wide text-[var(--site-muted)]';

export const siteChipActiveClass =
  'bg-[var(--site-brand-deep)] text-[var(--site-chip-active-text)] border-[var(--site-brand)] shadow-sm';

export const siteChipIdleClass =
  'bg-[var(--site-surface)] text-[var(--site-body)] border-[var(--site-border)] hover:border-[var(--site-brand)] hover:bg-[var(--site-hover)]';

/** Pill filter chips (marketplace, sell section, etc.) */
export function siteFilterChipClass(active) {
  return `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
    active ? siteChipActiveClass : siteChipIdleClass
  }`;
}

export const siteBtnPrimaryClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--site-btn)] px-4 py-2.5 text-[15px] font-semibold text-[var(--site-btn-text)] shadow-sm transition hover:bg-[var(--site-btn-hover)] disabled:opacity-50';

export const siteBtnSecondaryClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-[15px] font-semibold text-[var(--site-body)] transition hover:bg-[var(--site-hover)] hover:border-[var(--site-brand-deep)]';

export const siteBtnOutlineClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--site-brand)] bg-transparent px-4 py-2.5 text-[15px] font-semibold text-[var(--site-accent)] transition hover:bg-[var(--site-brand-deep)]/30';

export const siteBtnGhostClass =
  'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[15px] font-semibold text-[var(--site-body)] transition hover:bg-[var(--site-hover)] hover:text-[var(--site-accent)]';

export const siteHeaderShellClass =
  'fixed top-0 left-0 right-0 z-50 border-b border-[var(--site-border)]/90 bg-[var(--site-header-bg)] backdrop-blur-md';

export const siteFooterShellClass =
  'bg-[var(--site-footer-bg)] text-[var(--site-footer-text)] border-t border-[var(--site-border)]';
