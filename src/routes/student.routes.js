const express = require('express');
const studentController = require('../controllers/student.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createStudentSchema,
  updateStudentSchema
} = require('../validations/student.validation');

const router = express.Router();

router.use(authenticateToken);

// Accessible by Admin, Teacher, and Parents
router.get('/', requireRole('admin', 'teacher', 'parent'), studentController.getAll);
router.get('/:id', studentController.getById);

// Admin & Teacher management
router.post('/', requireRole('admin'), validate(createStudentSchema), studentController.create);
router.put('/:id', requireRole('admin'), validate(updateStudentSchema), studentController.update);
router.delete('/:id', requireRole('admin'), studentController.delete);

module.exports = router;
