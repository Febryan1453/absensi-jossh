const schoolSessionService = require('../services/schoolSession.service');
const ApiResponse = require('../utils/response');

class SchoolSessionController {
  async getAll(req, res, next) {
    try {
      const result = await schoolSessionService.getAll(req.query);
      return ApiResponse.success(res, 200, 'School sessions retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getActive(req, res, next) {
    try {
      const result = await schoolSessionService.getActive();
      return ApiResponse.success(res, 200, 'Active school session retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await schoolSessionService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'School session details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await schoolSessionService.create(req.body);
      return ApiResponse.created(res, 'School session created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await schoolSessionService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'School session updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await schoolSessionService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'School session deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchoolSessionController();
