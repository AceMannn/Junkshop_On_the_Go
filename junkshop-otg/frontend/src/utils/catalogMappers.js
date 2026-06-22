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
  const statusRaw = String(shop.status || '').toLowerCase();

  return {
    id: shop.slug || shop._id,
    _id: shop._id,
    name: shop.name,
    address: shop.address,
    phone: shop.phone || '',
    hours: shop.hours || '',
    distance: shop.distance || '—',
    status:
      statusRaw === 'open'
        ? 'Open'
        : statusRaw === 'closed'
          ? 'Closed'
          : shop.status || 'Open',
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
  };
}

export function normalizeMaterial(item) {
  return {
    id: item.slug || item._id,
    _id: item._id,
    category: item.category,
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

export function normalizeProviderMaterial(item) {
  return {
    id: item._id,
    _id: item._id,
    name: item.name,
    category: item.category,
    price: item.price,
    previousPrice: item.previousPrice,
    unit: item.unit || 'kg',
    available: item.available !== false,
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
    amount: `₱${Number(row.totalAmount).toFixed(2)}`,
    shop: shopLabel,
    status:
      row.status === 'completed'
        ? 'Completed'
        : row.status === 'processing'
          ? 'Processing'
          : row.status,
  };
}
