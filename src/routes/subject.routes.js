const express = require('express');
const subjectController = require('../controllers/subject.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createSubjectSchema,
  updateSubjectSchema
} = require('../validations/subject.validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', subjectController.getAll);
router.get('/:id', subjectController.getById);

router.post('/', requireRole('admin'), validate(createSubjectSchema), subjectController.create);
router.put('/:id', requireRole('admin'), validate(updateSubjectSchema), subjectController.update);
router.delete('/:id', requireRole('admin'), subjectController.delete);

module.exports = router;
