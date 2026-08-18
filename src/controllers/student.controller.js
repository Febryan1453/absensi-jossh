const studentService = require('../services/student.service');
const ApiResponse = require('../utils/response');

class StudentController {
  async getAll(req, res, next) {
    try {
      const result = await studentService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Students retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await studentService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Student details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await studentService.create(req.body);
      return ApiResponse.created(res, 'Student created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await studentService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Student updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await studentService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'Student deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentController();
