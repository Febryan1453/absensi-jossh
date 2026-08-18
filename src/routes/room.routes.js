const express = require('express');
const roomController = require('../controllers/room.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createRoomSchema,
  updateRoomSchema
} = require('../validations/room.validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', roomController.getAll);
router.get('/:id', roomController.getById);

router.post('/', requireRole('admin'), validate(createRoomSchema), roomController.create);
router.put('/:id', requireRole('admin'), validate(updateRoomSchema), roomController.update);
router.delete('/:id', requireRole('admin'), roomController.delete);

module.exports = router;
