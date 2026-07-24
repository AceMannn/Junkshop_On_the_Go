export const superPageTitleClass = 'text-2xl sm:text-3xl font-bold text-[#191c1c] tracking-tight';

export const superCardClass =
  'rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md';

export const superInputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20';

export const superPrimaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-[#006c49] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005236] active:scale-[0.98] disabled:opacity-60';

export const superSidebarLinkClass = (active) =>
  `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
    active
      ? 'border-l-4 border-emerald-400 bg-white/10 text-emerald-200 font-semibold'
      : 'border-l-4 border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
  }`;

export const superFilterPillClass = (active) =>
  `rounded-full px-4 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap ${
    active
      ? 'bg-[#006c49] text-white border border-[#006c49]'
      : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
  }`;

export const superSecondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#191c1c] transition-colors hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-60';

export const superMobileNavClass = (active) =>
  `inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
    active
      ? 'bg-emerald-600 text-white'
      : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
  }`;
