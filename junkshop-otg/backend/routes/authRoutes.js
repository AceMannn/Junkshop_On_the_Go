const express = require('express');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProviderProfile,
  updateMe,
  changePassword,
  deactivateAccount,
  getFavorites,
  toggleFavorite,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Register account
router.post('/register', registerUser);

// Login account
router.post('/login', loginUser);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Current authenticated account
router.get('/me', protect, getCurrentUser);
router.patch('/me', protect, updateMe);
router.patch('/password', protect, changePassword);
router.patch('/deactivate', protect, deactivateAccount);
router.get('/favorites', protect, getFavorites);
router.post('/favorites/toggle', protect, toggleFavorite);
router.patch('/provider-profile', protect, updateProviderProfile);

module.exports = router;