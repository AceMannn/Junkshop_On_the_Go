import { useCallback, useEffect, useState } from 'react';

import { domainApi } from '../services/api';

import { normalizeJunkshop, normalizeMaterial } from '../utils/catalogMappers';

import { REFRESH_INTERVAL_MS, useAutoRefresh } from './useAutoRefresh';

const DEFAULT_CENTER = { lat: 14.5995, lng: 121.0055 };

function useCustomerCoords() {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setCoords(DEFAULT_CENTER);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
    );
  }, []);

  return coords;
}

export function useCatalogJunkshops({ autoRefresh = true, partnersOnly = false, withPending = false } = {}) {
  const coords = useCustomerCoords();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('api');

  const fetchShops = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const { junkshops } = await domainApi.getJunkshops({
          lat: coords?.lat,
          lng: coords?.lng,
          partnersOnly,
          withPending,
        });

        setShops((junkshops || []).map(normalizeJunkshop));
        setSource('api');
        setError(null);
      } catch (err) {
        setError(err.message);
        if (!silent) {
          setShops([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [coords, partnersOnly, withPending]
  );

  useEffect(() => {
    fetchShops(false);
  }, [fetchShops]);

  useAutoRefresh(() => fetchShops(true), {
    enabled: autoRefresh,
    intervalMs: REFRESH_INTERVAL_MS,
  });

  return { shops, loading, error, source, coords, refresh: () => fetchShops(true) };
}

export function useCatalogMaterials({ autoRefresh = true } = {}) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('api');

  const fetchMaterials = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const { materials: rows } = await domainApi.getCatalogMaterials();

      setMaterials((rows || []).map(normalizeMaterial));
      setSource('api');
      setError(null);
    } catch (err) {
      setError(err.message);
      if (!silent) {
        setMaterials([]);
      }
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

  return { materials, loading, error, source, refresh: () => fetchMaterials(true) };
}

export function useFeaturedMaterials({ autoRefresh = true } = {}) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMaterials = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const { materials: rows } = await domainApi.getFeaturedMaterials();

      setMaterials((rows || []).map(normalizeMaterial));
      setError(null);
    } catch (err) {
      setError(err.message);
      setMaterials([]);
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

