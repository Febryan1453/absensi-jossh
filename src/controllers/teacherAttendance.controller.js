const teacherAttendanceService = require('../services/teacherAttendance.service');
const ApiResponse = require('../utils/response');

class TeacherAttendanceController {
  async getAll(req, res, next) {
    try {
      const result = await teacherAttendanceService.getAll(req.query, req.user);
      return ApiResponse.success(res, 200, 'Teacher attendances retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await teacherAttendanceService.getById(req.params.id, req.user);
      return ApiResponse.success(res, 200, 'Teacher attendance details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req, res, next) {
    try {
      const context = {
        user: req.user || null,
        device: req.device || null,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const payload = {
        ...req.body,
        device_id: req.body.device_id || (req.device ? req.device.id : null)
      };

      const result = await teacherAttendanceService.checkIn(payload, context);
      return ApiResponse.created(res, 'Teacher check-in recorded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req, res, next) {
    try {
      const context = {
        user: req.user || null,
        device: req.device || null,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const payload = {
        ...req.body,
        device_id: req.body.device_id || (req.device ? req.device.id : null)
      };

      const result = await teacherAttendanceService.checkOut(payload, context);
      return ApiResponse.success(res, 200, 'Teacher check-out recorded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async recordManual(req, res, next) {
    try {
      const context = {
        user: req.user || null,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const result = await teacherAttendanceService.recordManual(req.body, context);
      return ApiResponse.success(res, 200, 'Manual teacher attendance entry recorded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getTodaySummary(req, res, next) {
    try {
      const result = await teacherAttendanceService.getTodaySummary(req.query);
      return ApiResponse.success(res, 200, 'Teacher attendance summary retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeacherAttendanceController();
