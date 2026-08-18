const roomRepository = require('../repositories/room.repository');
const { NotFoundError, ConflictError } = require('../utils/appError');

class RoomService {
  async getAll(query) {
    const { status, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      roomRepository.findAll({ status, search, limit, offset }),
      roomRepository.countAll({ status, search })
    ]);

    return {
      items,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const item = await roomRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Room with ID ${id} not found`);
    }
    return item;
  }

  async create(data) {
    const existing = await roomRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError(`Room with code '${data.code}' already exists`);
    }

    const id = await roomRepository.create(data);
    return this.getById(id);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    if (data.code && data.code !== existing.code) {
      const duplicate = await roomRepository.findByCode(data.code);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        throw new ConflictError(`Room with code '${data.code}' already exists`);
      }
    }

    await roomRepository.update(id, data);
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await roomRepository.delete(id);
    return true;
  }
}

module.exports = new RoomService();
