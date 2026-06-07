const STORAGE_KEY = 'junkshop_favorite_shops';

export function getFavoriteShopIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteShopIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.map(String)));
}

export function toggleFavoriteShopId(id) {
  const key = String(id);
  const current = getFavoriteShopIds();
  const next = current.includes(key)
    ? current.filter((item) => item !== key)
    : [...current, key];
  saveFavoriteShopIds(next);
  return next;
}

export function isFavoriteShopId(id, favoriteIds) {
  return favoriteIds.includes(String(id));
}
