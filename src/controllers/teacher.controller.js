const teacherService = require('../services/teacher.service');
const ApiResponse = require('../utils/response');

class TeacherController {
  async getAll(req, res, next) {
    try {
      const result = await teacherService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Teachers retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await teacherService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Teacher details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await teacherService.create(req.body);
      return ApiResponse.created(res, 'Teacher created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await teacherService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Teacher updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await teacherService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'Teacher deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeacherController();
