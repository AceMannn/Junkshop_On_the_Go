import { getShopStatusLabel } from './operatingHours';

export function shopDirectionsUrl(shop) {
  const lat = Number(shop?.lat);
  const lng = Number(shop?.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  const query = shop?.address || shop?.name || 'junkshop';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function normalizeJunkshop(shop) {
  const accountStatus = shop.accountStatus || null;
  const availabilityStatus =
    shop.status === 'open' || shop.status === 'closed' ? shop.status : 'open';

  const normalized = {
    id: shop.slug || shop._id,
    _id: shop._id,
    name: shop.name,
    address: shop.address,
    phone: accountStatus === 'suspended' ? '' : shop.phone || '',
    hours: shop.hours || '',
    operatingHours: shop.operatingHours || [],
    distance: shop.distance || '—',
    accountStatus,
    moderationLabel: shop.moderationLabel || (accountStatus === 'suspended' ? 'Suspended' : ''),
    rating: shop.rating ?? 0,
    reviewCount: shop.reviewCount ?? 0,
    materials: shop.materials || [],
    listingPrices: shop.listingPrices || [],
    topPrice: shop.topPrice || '',
    lat: shop.location?.lat,
    lng: shop.location?.lng,
    isPartner: Boolean(shop.isPartner),
    distanceKm: shop.distanceKm,
    latestReview: shop.latestReview || null,
    badges: shop.badges || [],
    shopPhotoUrl: shop.shopPhotoUrl || '',
    description: shop.description || '',
    verificationStatus: shop.verificationStatus || 'draft',
    availabilityStatus,
  };

  normalized.status = getShopStatusLabel(normalized);

  return normalized;
}

export function normalizeMaterialCategory(category, material = '') {
  const raw = String(category || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  const materialName = String(material || '').trim().toLowerCase();

  if (raw === 'ewaste' || raw === 'e-waste' || raw === 'electronic-waste') {
    return 'e-waste';
  }

  if (
    raw === 'aluminum' ||
    raw === 'aluminium' ||
    raw === 'copper' ||
    raw === 'steel' ||
    raw === 'iron' ||
    raw === 'scrap-metal'
  ) {
    return 'metal';
  }

  if (
    raw === 'tires' ||
    raw === 'tire' ||
    raw === 'tyres' ||
    raw === 'tyre' ||
    raw === 'rubber-tires' ||
    raw === 'cardboard' ||
    materialName.includes('tire') ||
    materialName.includes('tyre') ||
    materialName.includes('cardboard')
  ) {
    return 'tires';
  }

  return raw || 'other';
}

export function formatMaterialCategoryLabel(category) {
  const normalized = normalizeMaterialCategory(category);
  if (normalized === 'e-waste') return 'E-waste';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function normalizeMaterial(item) {
  const category = normalizeMaterialCategory(item.category, item.name);

  return {
    id: item.slug || item._id,
    _id: item._id,
    category,
    material: item.name,
    perKgPrice: item.priceLabel || (item.price != null ? `₱${item.price}` : '—'),
    examples: item.examples || '',
    notes: item.notes || '',
    price: item.price,
    unit: item.unit || 'kg',
    previousPrice: item.previousPrice,
    postedAt: item.createdAt || item.updatedAt,
    updatedAt: item.updatedAt,
    source: item.source || (item.isCatalog ? 'catalog' : 'partner'),
    junkshop: item.junkshop || null,
  };
}

export function getMaterialTrend(item) {
  if (item.previousPrice == null || item.price == null) {
    return 'stable';
  }
  if (item.price > item.previousPrice) return 'up';
  if (item.price < item.previousPrice) return 'down';
  return 'stable';
}

export function formatUpdatedDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function shopStatusBadgeClass(status) {
  if (status === 'Suspended') {
    return 'bg-amber-100 text-amber-900';
  }
  if (status === 'Open' || status === 'Open now') {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (status === 'Closed now') {
    return 'bg-zinc-100 text-zinc-600';
  }
  return 'bg-red-100 text-red-700';
}

export function normalizeProviderMaterial(item) {
  const category = normalizeMaterialCategory(item.category, item.name);

  return {
    id: item._id,
    _id: item._id,
    name: item.name,
    category,
    price: item.price,
    previousPrice: item.previousPrice,
    unit: item.unit || 'kg',
    available: item.available !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function normalizeProviderJunkshop(shop) {
  return {
    _id: shop._id,
    id: String(shop._id),
    name: shop.name,
    address: shop.address,
    phone: shop.phone || '',
    hours: shop.hours || '',
    operatingHours: shop.operatingHours || [],
    status: shop.status || 'open',
    lat: shop.location?.lat,
    lng: shop.location?.lng,
    materials: shop.materials || [],
    topPrice: shop.topPrice || '',
    rating: shop.rating ?? 0,
    reviewCount: shop.reviewCount ?? 0,
  };
}

export function normalizeTransaction(row) {
  const provider = row.provider;
  const customer = row.customer;
  const amountValue = Number(row.totalAmount) || 0;
  const amount = `₱${amountValue.toFixed(2)}`;

  if (provider?.accountStatus === 'suspended') {
    return {
      id: row._id,
      date: new Date(row.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      material: row.material,
      weightKg: Number(row.weight) || 0,
      weightUnit: row.unit || 'kg',
      weight: `${row.weight} ${row.unit || 'kg'}`,
      amount,
      amountValue,
      isPaidTransaction: amountValue > 0,
      shop: 'Suspended Junkshop Owner',
      status:
        row.status === 'completed'
          ? 'Completed'
          : row.status === 'processing'
            ? 'Processing'
            : row.status,
      accountStatus: 'suspended',
    };
  }

  if (customer?.accountStatus === 'suspended') {
    return {
      id: row._id,
      date: new Date(row.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      material: row.material,
      weightKg: Number(row.weight) || 0,
      weightUnit: row.unit || 'kg',
      weight: `${row.weight} ${row.unit || 'kg'}`,
      amount,
      amountValue,
      isPaidTransaction: amountValue > 0,
      shop: 'Suspended Customer',
      status:
        row.status === 'completed'
          ? 'Completed'
          : row.status === 'processing'
            ? 'Processing'
            : row.status,
      accountStatus: 'suspended',
    };
  }

  const shopLabel =
    provider?.junkshopName ||
    [provider?.firstName, provider?.lastName].filter(Boolean).join(' ') ||
    'Junkshop';

  return {
    id: row._id,
    date: new Date(row.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    material: row.material,
    weightKg: Number(row.weight) || 0,
    weightUnit: row.unit || 'kg',
    weight: `${row.weight} ${row.unit || 'kg'}`,
    amount,
    amountValue,
    isPaidTransaction: amountValue > 0,
    shop: shopLabel,
    status:
      row.status === 'completed'
        ? 'Completed'
        : row.status === 'processing'
          ? 'Processing'
          : row.status,
  };
}
