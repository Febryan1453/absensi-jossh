const express = require('express');
const teachingScheduleController = require('../controllers/teachingSchedule.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createTeachingScheduleSchema,
  updateTeachingScheduleSchema
} = require('../validations/teachingSchedule.validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', teachingScheduleController.getAll);
router.get('/:id', teachingScheduleController.getById);

// Admin & Teacher schedule management
router.post('/', requireRole('admin'), validate(createTeachingScheduleSchema), teachingScheduleController.create);
router.put('/:id', requireRole('admin'), validate(updateTeachingScheduleSchema), teachingScheduleController.update);
router.delete('/:id', requireRole('admin'), teachingScheduleController.delete);

module.exports = router;
