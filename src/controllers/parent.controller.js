const parentService = require('../services/parent.service');
const ApiResponse = require('../utils/response');

class ParentController {
  async getAll(req, res, next) {
    try {
      const result = await parentService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Parents retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await parentService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Parent details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await parentService.create(req.body);
      return ApiResponse.created(res, 'Parent created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await parentService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Parent updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await parentService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'Parent deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async linkStudent(req, res, next) {
    try {
      const result = await parentService.linkStudent(req.params.id, req.body.student_id, req.body);
      return ApiResponse.created(res, 'Student linked to parent successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async unlinkStudent(req, res, next) {
    try {
      await parentService.unlinkStudent(req.params.id, req.params.studentId);
      return ApiResponse.success(res, 200, 'Student unlinked from parent successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ParentController();
