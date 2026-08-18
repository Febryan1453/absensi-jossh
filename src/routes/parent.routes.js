const express = require('express');
const parentController = require('../controllers/parent.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createParentSchema,
  updateParentSchema,
  linkStudentSchema
} = require('../validations/parent.validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('admin', 'teacher'), parentController.getAll);
router.get('/:id', parentController.getById);

// Admin-only management
router.post('/', requireRole('admin'), validate(createParentSchema), parentController.create);
router.put('/:id', requireRole('admin'), validate(updateParentSchema), parentController.update);
router.delete('/:id', requireRole('admin'), parentController.delete);

// Parent - Student relationships
router.post('/:id/students', requireRole('admin'), validate(linkStudentSchema), parentController.linkStudent);
router.delete('/:id/students/:studentId', requireRole('admin'), parentController.unlinkStudent);

module.exports = router;
