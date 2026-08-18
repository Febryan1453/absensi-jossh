const subjectService = require('../services/subject.service');
const ApiResponse = require('../utils/response');

class SubjectController {
  async getAll(req, res, next) {
    try {
      const result = await subjectService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Subjects retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await subjectService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Subject details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await subjectService.create(req.body);
      return ApiResponse.created(res, 'Subject created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await subjectService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Subject updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await subjectService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'Subject deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubjectController();
