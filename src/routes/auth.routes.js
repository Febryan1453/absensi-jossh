const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema
} = require('../validations/auth.validation');

const router = express.Router();

// Public routes
router.post('/login', validate(loginSchema), authController.login);

// Account provisioning (admin only)
// In a school attendance system accounts are created by the administrator,
// never by self service. Leaving this route public allowed anyone who could
// reach the API to create an account with the role of their choice, including
// 'admin', because the role is taken straight from the request body.
router.post(
  '/register',
  authenticateToken,
  requireRole('admin'),
  validate(registerSchema),
  authController.register
);

// Protected routes (requires valid JWT token)
router.get('/me', authenticateToken, authController.getMe);
router.put('/change-password', authenticateToken, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
