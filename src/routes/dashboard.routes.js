const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin', 'teacher'));

router.get('/summary', dashboardController.getSummary);

module.exports = router;
