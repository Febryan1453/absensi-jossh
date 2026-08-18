const express = require('express');
const academicYearController = require('../controllers/academicYear.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createAcademicYearSchema,
  updateAcademicYearSchema
} = require('../validations/academicYear.validation');

const router = express.Router();

// Require authentication for all academic year endpoints
router.use(authenticateToken);

router.get('/', academicYearController.getAll);
router.get('/active', academicYearController.getActive);
router.get('/:id', academicYearController.getById);

// Admin-only mutations
router.post('/', requireRole('admin'), validate(createAcademicYearSchema), academicYearController.create);
router.put('/:id', requireRole('admin'), validate(updateAcademicYearSchema), academicYearController.update);
router.delete('/:id', requireRole('admin'), academicYearController.delete);

module.exports = router;
