const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = express.Router();

/**
 * Every route here is admin-only.
 *
 * These endpoints read and write the gateway credential and decide whether
 * real messages go out to parents' phones. That is the school's billing
 * account and its reputation, so it stays behind the same guard as the rest of
 * the management surface.
 */
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/settings', whatsappController.getSettings);
router.put('/settings', whatsappController.updateSettings);
router.post('/settings/test', whatsappController.testConnection);

router.get('/templates', whatsappController.getTemplates);
router.put('/templates', whatsappController.updateTemplates);

router.post('/notifications/:id/resend', whatsappController.resend);
router.post('/notifications/resend-failed', whatsappController.resendFailed);

module.exports = router;
