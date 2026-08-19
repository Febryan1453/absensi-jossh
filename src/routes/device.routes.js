const express = require('express');
const deviceController = require('../controllers/device.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authenticateDevice } = require('../middlewares/deviceAuth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createDeviceSchema,
  updateDeviceSchema
} = require('../validations/device.validation');

const router = express.Router();

// Device heartbeat ping (supports device auth header or JWT)
router.post('/:id/ping', authenticateDevice, deviceController.ping);

// Admin device management
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', deviceController.getAll);
router.get('/:id', deviceController.getById);
router.post('/', validate(createDeviceSchema), deviceController.create);

// Credential routes. POST rather than GET on purpose: reading a gate key is an
// action with consequences, it must not be reachable by a link, a prefetch or
// a browser history entry, and it should stand out in an access log.
router.post('/:id/pairing-key', deviceController.revealKey);
router.post('/:id/rotate-key', deviceController.rotateKey);
router.put('/:id', validate(updateDeviceSchema), deviceController.update);
router.delete('/:id', deviceController.delete);

module.exports = router;
