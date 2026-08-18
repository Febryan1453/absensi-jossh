const authService = require('../services/auth.service');
const ApiResponse = require('../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.created(res, 'User registered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return ApiResponse.success(res, 200, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const result = await authService.getMe(req.user.id);
      return ApiResponse.success(res, 200, 'User profile retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, oldPassword, newPassword);
      return ApiResponse.success(res, 200, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
