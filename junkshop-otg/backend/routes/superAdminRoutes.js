const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { requireSuperAdmin } = require('../middlewares/adminMiddleware');
const superAdminController = require('../controllers/superAdminController');

const router = express.Router();

router.use(protect, requireSuperAdmin);

router.get('/admins', superAdminController.listAdmins);
router.post('/admins', superAdminController.createAdmin);
router.patch('/admins/:id', superAdminController.updateAdmin);
router.patch('/admins/:id/password', superAdminController.updateAdminPassword);
router.delete('/admins/:id', superAdminController.deleteAdmin);
router.get('/settings', superAdminController.getSystemSettings);
router.patch('/settings', superAdminController.updateSystemSettings);
router.get('/exports/datasets', superAdminController.listExportCatalog);
router.get('/exports/history', superAdminController.listExportHistory);
router.post('/exports', superAdminController.runDataExports);
router.delete('/deleted-records/:type/:id/permanent', superAdminController.permanentlyDeleteRecord);

module.exports = router;
