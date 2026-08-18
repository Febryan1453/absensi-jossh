const express = require('express');
const teacherController = require('../controllers/teacher.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createTeacherSchema,
  updateTeacherSchema
} = require('../validations/teacher.validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', teacherController.getAll);
router.get('/:id', teacherController.getById);

// Admin-only management
router.post('/', requireRole('admin'), validate(createTeacherSchema), teacherController.create);
router.put('/:id', requireRole('admin'), validate(updateTeacherSchema), teacherController.update);
router.delete('/:id', requireRole('admin'), teacherController.delete);

module.exports = router;
