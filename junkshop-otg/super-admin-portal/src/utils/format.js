export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function formatShortDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `₱${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatActionLabel(action) {
  if (!action) return '—';
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function typeLabel(type) {
  const map = {
    users: 'Users',
    contacts: 'Contact',
    transactions: 'Transactions',
    pickups: 'Pickups',
    materials: 'Materials',
    junkshops: 'Junkshops',
    notifications: 'Notifications',
  };
  return (
    map[type] ||
    String(type || '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function actorRoleLabel(role) {
  if (!role) return 'System';
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return role;
}

export function imageSrc(data, mimeType = 'image/jpeg') {
  if (!data) return '';
  if (data.startsWith('data:')) return data;
  if (/^https?:\/\//i.test(data)) return data;
  return `data:${mimeType || 'image/jpeg'};base64,${data}`;
}

export function statusPillClass(status) {
  const map = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    draft: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    suspended: 'bg-amber-100 text-amber-800 border-amber-200',
    banned: 'bg-red-100 text-red-800 border-red-200',
    deleted: 'bg-zinc-200 text-zinc-700 border-zinc-300',
    processing: 'bg-amber-100 text-amber-800 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    new: 'bg-sky-100 text-sky-800 border-sky-200',
    read: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };
  return map[status] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
}

export function rolePillClass(role) {
  const map = {
    customer: 'bg-violet-100 text-violet-800 border-violet-200',
    provider: 'bg-orange-100 text-orange-800 border-orange-200',
    admin: 'bg-sky-100 text-sky-800 border-sky-200',
    super_admin: 'bg-violet-100 text-violet-800 border-violet-200',
  };
  return map[role] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
}

export function userInitials(name, email) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function shortAppId(id) {
  if (!id) return '—';
  const tail = String(id).slice(-6).toUpperCase();
  return `APP-${tail}`;
}
