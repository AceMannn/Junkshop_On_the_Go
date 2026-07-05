const CATEGORY_COLORS = {
  plastic: {
    card: 'bg-sky-50 border-sky-200',
    badge: 'text-sky-800',
    price: 'text-sky-900',
  },
  paper: {
    card: 'bg-amber-50 border-amber-200',
    badge: 'text-amber-800',
    price: 'text-amber-900',
  },
  metal: {
    card: 'bg-slate-100 border-slate-300',
    badge: 'text-slate-800',
    price: 'text-slate-900',
  },
  glass: {
    card: 'bg-cyan-50 border-cyan-200',
    badge: 'text-cyan-800',
    price: 'text-cyan-900',
  },
  'e-waste': {
    card: 'bg-violet-50 border-violet-200',
    badge: 'text-violet-800',
    price: 'text-violet-900',
  },
  ewaste: {
    card: 'bg-violet-50 border-violet-200',
    badge: 'text-violet-800',
    price: 'text-violet-900',
  },
  tires: {
    card: 'bg-orange-50 border-orange-200',
    badge: 'text-orange-800',
    price: 'text-orange-900',
  },
};

const DEFAULT_COLORS = {
  card: 'bg-emerald-50 border-emerald-200',
  badge: 'text-emerald-800',
  price: 'text-emerald-900',
};

export function getMaterialCategoryColors(category) {
  const key = String(category || '')
    .toLowerCase()
    .replace(/\s+/g, '-');
  return CATEGORY_COLORS[key] || DEFAULT_COLORS;
}
