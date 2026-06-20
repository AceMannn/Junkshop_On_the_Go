const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';
const USER_AGENT = 'JunkShopOnTheGo/1.0 (educational capstone project)';

/** Metro Manila bias: lon_min, lat_max, lon_max, lat_min */
const METRO_VIEWBOX = '120.90,14.85,121.15,14.35';

const cache = new Map();
const GEOCODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ROUTE_TTL_MS = 24 * 60 * 60 * 1000;

let lastExternalRequest = 0;
const MIN_INTERVAL_MS = 1100;

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key, data, ttl) {
  cache.set(key, { data, expires: Date.now() + ttl });
}

function uniqueQueries(queries) {
  const seen = new Set();
  return queries
    .map((q) => q.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((q) => {
      const key = q.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildGeocodeQueries(query) {
  const base = query.trim();
  const expanded = base
    .replace(/\bQ\.?\s*C\.?\b/gi, 'Quezon City')
    .replace(/\bProj\.?\b/gi, 'Project')
    .replace(/\bBrgy\.?\b/gi, 'Barangay')
    .replace(/\bSt\.?\b/gi, 'Street');
  const withCountry = /philippines/i.test(expanded) ? expanded : `${expanded} Philippines`;
  const noHouseNumber = withCountry.replace(/^\s*\d+\s*[A-Za-z]?\s+/, '');
  const simplified = noHouseNumber
    .replace(/\bProject\s*\d+\b/gi, '')
    .replace(/\bBarangay\b/gi, '')
    .replace(/\s+/g, ' ');

  return uniqueQueries([base, expanded, withCountry, noHouseNumber, simplified]);
}

async function throttledFetch(url) {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastExternalRequest));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastExternalRequest = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Map service unavailable (${response.status})`);
  }

  return response.json();
}

async function fetchGeocode(query) {
  const q = query.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '6',
    countrycodes: 'ph',
    viewbox: METRO_VIEWBOX,
    bounded: '0',
  });

  const data = await throttledFetch(`${NOMINATIM_BASE}/search?${params}`);
  return (data || [])
    .map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      label: item.display_name,
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

async function geocodeSearch(query) {
  const q = query.trim();
  if (q.length < 3) return [];

  const cacheKey = `geo:${q.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  for (const candidate of buildGeocodeQueries(q)) {
    const candidateKey = `geo:${candidate.toLowerCase()}`;
    const cachedCandidate = cacheGet(candidateKey);
    if (cachedCandidate) {
      cacheSet(cacheKey, cachedCandidate, GEOCODE_TTL_MS);
      return cachedCandidate;
    }

    const results = await fetchGeocode(candidate);
    cacheSet(candidateKey, results, GEOCODE_TTL_MS);
    if (results.length > 0) {
      cacheSet(cacheKey, results, GEOCODE_TTL_MS);
      return results;
    }
  }

  cacheSet(cacheKey, [], GEOCODE_TTL_MS);
  return [];
}

async function reverseGeocode(lat, lng) {
  const cacheKey = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
  });

  const data = await throttledFetch(`${NOMINATIM_BASE}/reverse?${params}`);
  const result = {
    lat,
    lng,
    label: data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };

  cacheSet(cacheKey, result, GEOCODE_TTL_MS);
  return result;
}

async function getRoute(fromLat, fromLng, toLat, toLng) {
  const cacheKey = `route:${fromLat.toFixed(4)},${fromLng.toFixed(4)}-${toLat.toFixed(4)},${toLng.toFixed(4)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url = `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  const data = await throttledFetch(url);

  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error('No driving route found between these points.');
  }

  const route = data.routes[0];
  const result = {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
  };

  cacheSet(cacheKey, result, ROUTE_TTL_MS);
  return result;
}

async function geocodeFirst(query) {
  const results = await geocodeSearch(query);
  return results[0] || null;
}

module.exports = {
  geocodeSearch,
  geocodeFirst,
  reverseGeocode,
  getRoute,
};
