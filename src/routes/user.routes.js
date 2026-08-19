const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  updateUserSchema,
  resetPasswordSchema
} = require('../validations/user.validation');

const router = express.Router();

// Every route here is administration of who may sign in, so the whole router
// is admin-only — including the reads. A teacher listing every account in the
// school, with roles and email addresses, is a directory of targets.
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', userController.getAll);
router.get('/:id', userController.getById);

router.put('/:id', validate(updateUserSchema), userController.update);
router.put('/:id/password', validate(resetPasswordSchema), userController.resetPassword);

// Accounts are never deleted, only deactivated.
//
// users.id is referenced by teachers, students, parents, and by every row in
// attendance_events. Deleting a user therefore either fails on a foreign key
// or takes attendance history with it, and attendance history is the one thing
// this system exists to keep. Setting status to 'inactive' blocks the login
// (auth.middleware checks it) while leaving the record of what that person did
// intact.

module.exports = router;
