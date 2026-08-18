const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/response');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const result = await dashboardService.getSummary(req.query);
      return ApiResponse.success(res, 200, 'Dashboard metrics and summary retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
