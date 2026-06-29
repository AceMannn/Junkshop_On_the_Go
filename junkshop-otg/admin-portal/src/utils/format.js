export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `₱${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function imageSrc(data, mimeType = 'image/jpeg') {
  if (!data) return '';
  if (data.startsWith('data:')) return data;
  if (/^https?:\/\//i.test(data)) return data;
  return `data:${mimeType || 'image/jpeg'};base64,${data}`;
}

export function statusPillClass(status) {
  const map = {
    pending: 'bg-sky-100 text-sky-900 border-sky-200',
    approved: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    rejected: 'bg-red-100 text-red-900 border-red-200',
    draft: 'bg-amber-100 text-amber-900 border-amber-200',
    active: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    suspended: 'bg-amber-100 text-amber-900 border-amber-200',
    banned: 'bg-red-100 text-red-900 border-red-200',
    deleted: 'bg-zinc-200 text-zinc-800 border-zinc-300',
    new: 'bg-sky-100 text-sky-900 border-sky-200',
    read: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    resolved: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  };
  return map[status] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
}
