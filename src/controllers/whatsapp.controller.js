const whatsappService = require('../services/whatsapp.service');
const ApiResponse = require('../utils/response');

class WhatsappController {
  async getSettings(req, res, next) {
    try {
      const result = await whatsappService.getSettings();
      return ApiResponse.success(res, 200, 'WhatsApp settings retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const result = await whatsappService.updateSettings(req.body);
      return ApiResponse.success(res, 200, 'WhatsApp settings updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connection test. Talks to the gateway's device-status endpoint only, so it
   * can be run as often as needed without a single message reaching a parent.
   */
  async testConnection(req, res, next) {
    try {
      const result = await whatsappService.testConnection();
      return ApiResponse.success(res, 200, 'WhatsApp connection tested', result);
    } catch (error) {
      next(error);
    }
  }

  async getTemplates(req, res, next) {
    try {
      const templates = await whatsappService.getTemplates();
      return ApiResponse.success(res, 200, 'WhatsApp templates retrieved successfully', {
        templates
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTemplates(req, res, next) {
    try {
      const templates = await whatsappService.updateTemplates(req.body.templates);
      return ApiResponse.success(res, 200, 'WhatsApp templates updated successfully', {
        templates
      });
    } catch (error) {
      next(error);
    }
  }

  async resend(req, res, next) {
    try {
      const result = await whatsappService.resend(req.params.id);
      return ApiResponse.success(res, 200, 'Notification resent', result);
    } catch (error) {
      next(error);
    }
  }

  async resendFailed(req, res, next) {
    try {
      const result = await whatsappService.resendFailed();
      return ApiResponse.success(res, 200, 'Failed notifications reprocessed', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WhatsappController();
