const express = require('express');
const attendanceEventController = require('../controllers/attendanceEvent.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', attendanceEventController.getAll);
router.get('/:id', attendanceEventController.getById);

module.exports = router;
