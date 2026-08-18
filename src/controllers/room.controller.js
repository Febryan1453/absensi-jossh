const roomService = require('../services/room.service');
const ApiResponse = require('../utils/response');

class RoomController {
  async getAll(req, res, next) {
    try {
      const result = await roomService.getAll(req.query);
      return ApiResponse.success(res, 200, 'Rooms retrieved successfully', result.items, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await roomService.getById(req.params.id);
      return ApiResponse.success(res, 200, 'Room details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await roomService.create(req.body);
      return ApiResponse.created(res, 'Room created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await roomService.update(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Room updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await roomService.delete(req.params.id);
      return ApiResponse.success(res, 200, 'Room deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoomController();
