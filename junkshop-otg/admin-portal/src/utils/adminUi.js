export const adminPageTitleClass = 'text-2xl sm:text-3xl font-bold text-[#191c1c] tracking-tight';

export const adminCardClass =
  'rounded-2xl border border-zinc-200 bg-white shadow-sm';

export const adminInputClass =
  'w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#154212]';

export const adminSelectClass =
  'rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#154212]';

export const adminPrimaryButtonClass =
  'inline-flex items-center justify-center rounded-xl bg-[#154212] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3310] disabled:opacity-60 transition-colors';

export const adminSecondaryButtonClass =
  'inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#191c1c] hover:bg-zinc-50 disabled:opacity-60 transition-colors';

export const adminFilterPillClass = (active) =>
  `rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
  }`;

export const adminSidebarLinkClass = (active) =>
  `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? 'bg-emerald-100/80 text-emerald-800'
      : 'text-zinc-600 hover:bg-zinc-100'
  }`;
