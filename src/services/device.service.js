const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const deviceRepository = require('../repositories/device.repository');
const { NotFoundError, ConflictError } = require('../utils/appError');

class DeviceService {
  async getAll(query) {
    const { status, type, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      deviceRepository.findAll({ status, type, search, limit, offset }),
      deviceRepository.countAll({ status, type, search })
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
    const item = await deviceRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Attendance device with ID ${id} not found`);
    }
    return item;
  }

  async create(data) {
    const existingCode = await deviceRepository.findByCode(data.code);
    if (existingCode) {
      throw new ConflictError(`Device with code '${data.code}' already exists`);
    }

    const deviceUuid = data.uuid || uuidv4();
    const apiKey = data.api_key || `dev_${crypto.randomBytes(24).toString('hex')}`;

    const id = await deviceRepository.create({
      ...data,
      uuid: deviceUuid,
      api_key: apiKey
    });

    return this.getById(id);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    if (data.code && data.code !== existing.code) {
      const duplicate = await deviceRepository.findByCode(data.code);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        throw new ConflictError(`Device with code '${data.code}' already exists`);
      }
    }

    await deviceRepository.update(id, data);
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await deviceRepository.delete(id);
    return true;
  }

  async ping(id) {
    await this.getById(id);
    await deviceRepository.updateLastSeen(id);
    return { id, last_seen_at: new Date() };
  }
}

module.exports = new DeviceService();
