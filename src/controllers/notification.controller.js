const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/response');

class NotificationController {
  async getAll(req, res, next) {
    try {
      const result = await notificationService.getAll(req.query, req.user);
      return ApiResponse.success(res, 200, 'Notifications retrieved successfully', result.items, {
        ...result.pagination,
        unreadCount: result.unreadCount
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await notificationService.getById(req.params.id, req.user);
      return ApiResponse.success(res, 200, 'Notification details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.params.id, req.user);
      return ApiResponse.success(res, 200, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user);
      return ApiResponse.success(res, 200, 'All notifications marked as read', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
