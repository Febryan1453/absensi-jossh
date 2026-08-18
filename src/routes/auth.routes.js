const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema
} = require('../validations/auth.validation');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Protected routes (requires valid JWT token)
router.get('/me', authenticateToken, authController.getMe);
router.put('/change-password', authenticateToken, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
