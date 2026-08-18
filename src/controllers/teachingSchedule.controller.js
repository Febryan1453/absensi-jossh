const teachingScheduleService = require('../services/teachingSchedule.service');
const ApiResponse = require('../utils/response');

class TeachingScheduleController {
  async getAll(req, res, next) {
    try {
      const result = await teachingScheduleService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Teaching schedules retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await teachingScheduleService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Teaching schedule details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await teachingScheduleService.create(req.body);
      return ApiResponse.created(res, 'Teaching schedule created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await teachingScheduleService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Teaching schedule updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await teachingScheduleService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'Teaching schedule deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeachingScheduleController();
