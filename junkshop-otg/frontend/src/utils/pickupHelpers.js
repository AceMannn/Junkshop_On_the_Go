export const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (8 AM – 12 PM)' },
  { id: 'afternoon', label: 'Afternoon (12 PM – 5 PM)' },
  { id: 'evening', label: 'Evening (5 PM – 7 PM)' },
];

export const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_transit: 'On the way',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Declined',
};

export const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-zinc-100 text-zinc-700',
  rejected: 'bg-red-100 text-red-800',
};

export function formatPickupSchedule(request) {
  if (!request?.scheduledDate) return '—';
  const slot = TIME_SLOTS.find((s) => s.id === request.timeSlot)?.label || request.timeSlot;
  const date = new Date(request.scheduledDate).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${date} · ${slot}`;
}

export function getCustomerDisplayName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer';
}

export function getShopName(request) {
  const shop = request?.junkshop;
  if (!shop) return request?.assignmentMode === 'nearest' ? 'Nearest available' : '—';
  return shop.name || shop.junkshopName || 'Junkshop';
}

export function materialsSummary(materials = []) {
  if (!materials.length) return '—';
  return materials.map((m) => m.name).join(', ');
}

export function canCustomerCancel(status) {
  return ['pending', 'accepted'].includes(status);
}

export function mapsLink(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}
