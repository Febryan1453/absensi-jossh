const classService = require('../services/class.service');
const ApiResponse = require('../utils/response');

class ClassController {
  async getAll(req, res, next) {
    try {
      const result = await classService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Classes retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await classService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Class details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await classService.create(req.body);
      return ApiResponse.created(res, 'Class created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await classService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Class updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await classService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'Class deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClassController();
