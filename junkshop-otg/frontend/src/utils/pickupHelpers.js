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
  return materials
    .map((m) => {
      const qty = m.quantity ?? m.qty ?? '';
      const unitLabel = m.unit === 'piece' ? 'pc' : 'kg';
      return qty ? `${m.name} ${qty}${unitLabel}` : m.name;
    })
    .join(', ');
}

export function materialNamesSummary(materials = []) {
  if (!materials.length) return '—';
  return materials.map((m) => m.name).filter(Boolean).join(', ') || '—';
}

export function formatPeso(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return '—';
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function materialUnitLabel(unit) {
  return unit === 'piece' ? 'pc' : 'kg';
}

export function materialPriceLabel(material) {
  const price = Number(material?.price);
  if (!Number.isFinite(price) || price <= 0) {
    return `Price not listed/${materialUnitLabel(material?.unit)}`;
  }
  return `${formatPeso(price)}/${materialUnitLabel(material?.unit)}`;
}

export function materialEstimatedSubtotal(material) {
  const existing = Number(material?.estimatedSubtotal);
  if (Number.isFinite(existing) && existing > 0) return existing;

  const price = Number(material?.price);
  const quantity = Number(material?.quantity ?? material?.qty);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }
  return Math.round(price * quantity * 100) / 100;
}

export function estimatedPayoutTotal(materials = []) {
  return Math.round(
    (materials || []).reduce((sum, material) => sum + materialEstimatedSubtotal(material), 0) * 100
  ) / 100;
}

export function pickupEstimatedPayout(request) {
  const stored = Number(request?.estimatedTotalAmount);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return estimatedPayoutTotal(request?.materials || []);
}

export const ACTIVE_PICKUP_STATUSES = ['pending', 'accepted', 'in_transit'];

export function isActivePickupStatus(status) {
  return ACTIVE_PICKUP_STATUSES.includes(status);
}

/** Auto-open pickup details from notifications/focus only when the user still needs to act. */
export function shouldAutoOpenPickupDetail(request) {
  if (!request) return false;
  if (isActivePickupStatus(request.status)) return true;
  return request.status === 'completed' && !request.rating?.score;
}

export function canCustomerCancel(status) {
  return ['pending', 'accepted'].includes(status);
}

export function mapsLink(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}
