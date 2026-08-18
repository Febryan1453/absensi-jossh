const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', notificationController.getAll);
router.patch('/read-all', notificationController.markAllAsRead);
router.get('/:id', notificationController.getById);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
