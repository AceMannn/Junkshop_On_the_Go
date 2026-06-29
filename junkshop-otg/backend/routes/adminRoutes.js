const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/adminMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/applications', adminController.listApplications);
router.get('/applications/:id/documents/:kind/:slot', adminController.getApplicationDocument);
router.get('/applications/:id/documents/:kind', adminController.getApplicationDocument);
router.get('/applications/:id', adminController.getApplication);
router.patch('/applications/:id/approve', adminController.approveApplication);
router.patch('/applications/:id/reject', adminController.rejectApplication);
router.patch('/applications/:id/request-reverification', adminController.requestReVerification);
router.patch('/applications/:id/reset-verification', adminController.hardResetVerification);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/badges', adminController.updateUserBadges);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/transactions', adminController.listTransactions);
router.delete('/transactions/:id', adminController.deleteTransaction);
router.get('/audit-logs', adminController.listAuditLogs);
router.get('/deleted-records', adminController.listDeletedRecords);
router.patch('/deleted-records/:type/:id/restore', adminController.restoreDeletedRecord);
router.get('/contact-messages', adminController.listContactMessages);
router.patch('/contact-messages/:id/status', adminController.updateContactMessageStatus);
router.delete('/contact-messages/:id', adminController.deleteContactMessage);

module.exports = router;
