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
const { authLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Current authenticated account
router.get('/me', protect, getCurrentUser);
router.patch('/me', protect, updateMe);
router.patch('/password', protect, changePassword);
router.patch('/deactivate', protect, deactivateAccount);
router.get('/favorites', protect, getFavorites);
router.post('/favorites/toggle', protect, toggleFavorite);
router.patch('/provider-profile', protect, updateProviderProfile);

module.exports = router;