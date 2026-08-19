const deviceService = require('../services/device.service');
const ApiResponse = require('../utils/response');

class DeviceController {
  async getAll(req, res, next) {
    try {
      const result = await deviceService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Attendance devices retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await deviceService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Device details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await deviceService.create(req.body);
      return ApiResponse.created(res, 'Attendance device created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await deviceService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Device updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns the gate credential. Separate route, separate name, so that a
   * search for who can read a device key has exactly two answers.
   */
  async revealKey(req, res, next) {
    try {
      const result = await deviceService.revealKey(req.params.id);
      return ApiResponse.success(res, 200, 'Device pairing key retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async rotateKey(req, res, next) {
    try {
      const result = await deviceService.rotateKey(req.params.id);
      return ApiResponse.success(res, 200, 'Device key rotated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await deviceService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'Device deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async ping(req, res, next) {
    try {
      const deviceId = req.device ? req.device.id : req.params.id;
      const result = await deviceService.ping(deviceId);
      return ApiResponse.success(res, 200, 'Device heartbeat acknowledged', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeviceController();
