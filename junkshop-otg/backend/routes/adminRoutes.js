const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/adminMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/applications', adminController.listApplications);
router.get('/applications/:id', adminController.getApplication);
router.patch('/applications/:id/approve', adminController.approveApplication);
router.patch('/applications/:id/reject', adminController.rejectApplication);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/badges', adminController.updateUserBadges);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/contact-messages', adminController.listContactMessages);
router.patch('/contact-messages/:id/status', adminController.updateContactMessageStatus);

module.exports = router;
