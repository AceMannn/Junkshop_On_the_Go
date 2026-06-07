import { useCallback, useEffect, useState } from 'react';
import { domainApi } from '../services/api';
import {
  normalizeProviderJunkshop,
  normalizeProviderMaterial,
} from '../utils/catalogMappers';
import { REFRESH_INTERVAL_MS, useAutoRefresh } from './useAutoRefresh';

export function useProviderJunkshop({ autoRefresh = true } = {}) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShop = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { junkshops } = await domainApi.getMyJunkshops();
      const first = junkshops?.[0];
      setShop(first ? normalizeProviderJunkshop(first) : null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShop(false);
  }, [fetchShop]);

  useAutoRefresh(() => fetchShop(true), {
    enabled: autoRefresh,
    intervalMs: REFRESH_INTERVAL_MS,
  });

  return { shop, loading, error, refresh: () => fetchShop(true) };
}

export function useProviderMaterials({ autoRefresh = true } = {}) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMaterials = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { materials: rows } = await domainApi.getMyMaterials();
      setMaterials((rows || []).map(normalizeProviderMaterial));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials(false);
  }, [fetchMaterials]);

  useAutoRefresh(() => fetchMaterials(true), {
    enabled: autoRefresh,
    intervalMs: REFRESH_INTERVAL_MS,
  });

  return { materials, loading, error, refresh: () => fetchMaterials(true) };
}
