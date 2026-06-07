const { geocodeSearch, reverseGeocode, getRoute } = require('../utils/mapService');

exports.geocode = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 3) {
      return res.status(400).json({ message: 'Search query must be at least 3 characters.' });
    }

    const results = await geocodeSearch(q);
    return res.json({ results });
  } catch (err) {
    return res.status(502).json({ message: err.message || 'Address search failed.' });
  }
};

exports.reverseGeocode = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Valid lat and lng are required.' });
    }

    const result = await reverseGeocode(lat, lng);
    return res.json({ result });
  } catch (err) {
    return res.status(502).json({ message: err.message || 'Could not resolve address for pin.' });
  }
};

exports.route = async (req, res) => {
  try {
    const fromLat = Number(req.query.fromLat);
    const fromLng = Number(req.query.fromLng);
    const toLat = Number(req.query.toLat);
    const toLng = Number(req.query.toLng);

    if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
      return res.status(400).json({ message: 'Valid from/to coordinates are required.' });
    }

    const route = await getRoute(fromLat, fromLng, toLat, toLng);
    return res.json({ route });
  } catch (err) {
    return res.status(502).json({ message: err.message || 'Could not calculate route.' });
  }
};
