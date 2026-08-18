const express = require('express');
const schoolSessionController = require('../controllers/schoolSession.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createSchoolSessionSchema,
  updateSchoolSessionSchema
} = require('../validations/schoolSession.validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', schoolSessionController.getAll);
router.get('/active', schoolSessionController.getActive);
router.get('/:id', schoolSessionController.getById);

router.post('/', requireRole('admin'), validate(createSchoolSessionSchema), schoolSessionController.create);
router.put('/:id', requireRole('admin'), validate(updateSchoolSessionSchema), schoolSessionController.update);
router.delete('/:id', requireRole('admin'), schoolSessionController.delete);

module.exports = router;
