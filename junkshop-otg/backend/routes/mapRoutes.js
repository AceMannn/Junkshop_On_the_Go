const express = require('express');
const mapController = require('../controllers/mapController');

const router = express.Router();

router.get('/geocode', mapController.geocode);
router.get('/reverse-geocode', mapController.reverseGeocode);
router.get('/route', mapController.route);

module.exports = router;
