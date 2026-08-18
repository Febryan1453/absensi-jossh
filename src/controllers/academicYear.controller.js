const academicYearService = require('../services/academicYear.service');
const ApiResponse = require('../utils/response');

class AcademicYearController {
  async getAll(req, res, next) {
    try {
      const result = await academicYearService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Academic years retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getActive(req, res, next) {
    try {
      const result = await academicYearService.getActive();
      return ApiResponse.success(res, 200, 'Active academic year retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await academicYearService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Academic year details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await academicYearService.create(req.body);
      return ApiResponse.created(res, 'Academic year created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await academicYearService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Academic year updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await academicYearService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'Academic year deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AcademicYearController();
