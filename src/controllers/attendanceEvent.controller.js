const attendanceEventService = require('../services/attendanceEvent.service');
const ApiResponse = require('../utils/response');

class AttendanceEventController {
  async getAll(req, res, next) {
    try {
      const result = await attendanceEventService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Attendance audit events retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await attendanceEventService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Attendance audit event details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceEventController();
