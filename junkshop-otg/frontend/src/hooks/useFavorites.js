import { useCallback, useEffect, useState } from 'react';
import { authApi } from '../services/api';
import { isFavoriteShopId } from '../utils/favorites';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { favoriteShopIds } = await authApi.getFavorites();
      setFavoriteIds((favoriteShopIds || []).map(String));
    } catch {
      setFavoriteIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavorite = useCallback(async (shopId) => {
    const key = String(shopId);
    try {
      const { favoriteShopIds } = await authApi.toggleFavorite(key);
      const next = (favoriteShopIds || []).map(String);
      setFavoriteIds(next);
      return next;
    } catch {
      setFavoriteIds((prev) =>
        prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]
      );
      return null;
    }
  }, []);

  return {
    favoriteIds,
    loading,
    isFavorite: (shopId) => isFavoriteShopId(shopId, favoriteIds),
    toggleFavorite,
    refresh: load,
  };
}
