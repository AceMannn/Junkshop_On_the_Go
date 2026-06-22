const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const verificationController = require('../controllers/verificationController');

const router = express.Router();

router.use(protect);

router.get('/me', verificationController.getMyVerification);
router.patch('/documents', verificationController.saveVerificationDocuments);
router.post('/submit', verificationController.submitVerification);

module.exports = router;
