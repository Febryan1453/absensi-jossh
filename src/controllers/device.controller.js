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

  /**
   * Heartbeat. Requires a device credential — the :id in the URL is ignored.
   *
   * It used to fall back to req.params.id when no credential was presented,
   * which meant an unauthenticated POST /devices/3/ping returned 200 and wrote
   * last_seen_at. The "Terakhir aktif" column on the gate screen is the only
   * sign of life an administrator has, and anyone able to reach the API could
   * make a dead or stolen gate look like it had just checked in.
   */
  /**
   * Gate bootstrap. Device credential only — there is deliberately no way to
   * reach this with a user token, so it can never become another route that
   * quietly hands a corridor tablet a staff-shaped view of the school.
   */
  async bootstrap(req, res, next) {
    try {
      if (!req.device) {
        return ApiResponse.error(
          res,
          401,
          'A device credential is required for this endpoint',
          'UNAUTHORIZED'
        );
      }
      const result = await deviceService.bootstrap(req.device);
      return ApiResponse.success(res, 200, 'Device bootstrap payload retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async ping(req, res, next) {
    try {
      if (!req.device) {
        return ApiResponse.error(
          res,
          401,
          'A device credential is required for this endpoint',
          'UNAUTHORIZED'
        );
      }
      const deviceId = req.device.id;
      const result = await deviceService.ping(deviceId);
      return ApiResponse.success(res, 200, 'Device heartbeat acknowledged', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeviceController();
