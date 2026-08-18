const express = require('express');
const classController = require('../controllers/class.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createClassSchema,
  updateClassSchema
} = require('../validations/class.validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', classController.getAll);
router.get('/:id', classController.getById);

// Admin-only management
router.post('/', requireRole('admin'), validate(createClassSchema), classController.create);
router.put('/:id', requireRole('admin'), validate(updateClassSchema), classController.update);
router.delete('/:id', requireRole('admin'), classController.delete);

module.exports = router;
