/** Shared public-site + auth design tokens (matches dashboard emerald/zinc theme). */

export const siteColors = {
  bg: '#f9f9f8',
  surface: '#ffffff',
  text: '#191c1c',
  muted: '#72796e',
  body: '#42493e',
  border: '#e4e4e7',
  brand: '#154212',
  accent: '#3DA35D',
};

export const siteContainerClass = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

export const sitePageClass = 'min-h-screen bg-[#f9f9f8] text-[#191c1c]';

export const siteSectionPadClass = 'py-16 sm:py-20';

export const siteHeroGradientClass =
  'relative overflow-hidden bg-gradient-to-br from-[#eef8f0] via-white to-[#f4fbf5] bg-[radial-gradient(circle_at_12px_12px,rgba(21,66,18,0.06)_2px,transparent_0)] bg-[size:28px_28px]';

export const siteCardClass =
  'min-w-0 overflow-hidden bg-white rounded-2xl border border-zinc-200 shadow-sm';

export const siteCardHoverClass =
  'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5';

export const siteInputClass =
  'w-full text-sm px-4 py-3 rounded-xl border border-zinc-200 bg-white text-[#191c1c] placeholder:text-[#72796e]/70 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-60';

export const siteLabelClass =
  'block text-xs font-semibold uppercase tracking-wide text-[#72796e]';

export const siteChipActiveClass =
  'bg-[#154212] text-white border-[#154212] shadow-sm';

export const siteChipIdleClass =
  'bg-white text-[#42493e] border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50/50';

/** Pill filter chips (marketplace, sell section, etc.) */
export function siteFilterChipClass(active) {
  return `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
    active ? siteChipActiveClass : siteChipIdleClass
  }`;
}

export const siteBtnPrimaryClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#154212] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:opacity-50';

export const siteBtnSecondaryClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-[#42493e] transition hover:bg-zinc-50';

export const siteBtnOutlineClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#154212] bg-white px-5 py-3 text-sm font-semibold text-[#154212] transition hover:bg-emerald-50';

export const siteBtnGhostClass =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#42493e] transition hover:bg-emerald-50 hover:text-[#154212]';

export const siteHeaderShellClass =
  'fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md';

export const siteFooterShellClass =
  'bg-[#191c1c] text-white border-t border-zinc-800';
