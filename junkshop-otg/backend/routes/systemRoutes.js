const express = require('express');
const { getPublicSystemSettings } = require('../utils/systemSettings');

const router = express.Router();

router.get('/settings', async (req, res) => {
  try {
    const settings = await getPublicSystemSettings();
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ message: 'Could not load system settings.' });
  }
});

module.exports = router;
