const userService = require('../services/user.service');
const ApiResponse = require('../utils/response');

class UserController {
  async getAll(req, res, next) {
    try {
      const result = await userService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Users retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await userService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'User details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      // req.user.id is the administrator making the change. The service needs
      // it to refuse an account removing its own access.
      const result = await userService.update(req.params.id, req.body, req.user.id);
      return ApiResponse.success(res, 200, 'User updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      await userService.resetPassword(req.params.id, req.body.password);
      return ApiResponse.success(res, 200, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
