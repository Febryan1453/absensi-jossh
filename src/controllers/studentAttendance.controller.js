const studentAttendanceService = require('../services/studentAttendance.service');
const ApiResponse = require('../utils/response');

class StudentAttendanceController {
  async getAll(req, res, next) {
    try {
      const result = await studentAttendanceService.getAll(req.query, req.user);
      return ApiResponse.success(res, 200, 'Student attendances retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await studentAttendanceService.getById(req.params.id, req.user);
      return ApiResponse.success(res, 200, 'Student attendance details retrieved successfully', result);
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

      const result = await studentAttendanceService.checkIn(payload, context);
      return ApiResponse.created(res, 'Student check-in recorded successfully', result);
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

      const result = await studentAttendanceService.checkOut(payload, context);
      return ApiResponse.success(res, 200, 'Student check-out recorded successfully', result);
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

      const result = await studentAttendanceService.recordManual(req.body, context);
      return ApiResponse.success(res, 200, 'Manual attendance entry recorded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getTodaySummary(req, res, next) {
    try {
      const result = await studentAttendanceService.getTodaySummary(req.query);
      return ApiResponse.success(res, 200, 'Student attendance summary retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentAttendanceController();
