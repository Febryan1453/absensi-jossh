const schoolSessionRepository = require('../repositories/schoolSession.repository');
const { NotFoundError, BadRequestError } = require('../utils/appError');
const { compareTimes } = require('../utils/date');

class SchoolSessionService {
  async getAll(query) {
    const { is_active, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const isActiveFilter = is_active !== undefined ? is_active === 'true' || is_active === true : undefined;

    const [items, total] = await Promise.all([
      schoolSessionRepository.findAll({ is_active: isActiveFilter, limit, offset }),
      schoolSessionRepository.countAll({ is_active: isActiveFilter })
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
    const item = await schoolSessionRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`School session with ID ${id} not found`);
    }
    return item;
  }

  async getActive() {
    const item = await schoolSessionRepository.findActive();
    if (!item) {
      throw new NotFoundError('No active school session found');
    }
    return item;
  }

  async create(data) {
    const { start_time, late_after, end_time, check_out_start, check_out_end } = data;

    if (compareTimes(start_time, late_after) > 0) {
      throw new BadRequestError('start_time cannot be later than late_after');
    }

    if (compareTimes(late_after, end_time) > 0) {
      throw new BadRequestError('late_after cannot be later than end_time');
    }

    if (check_out_start && check_out_end && compareTimes(check_out_start, check_out_end) > 0) {
      throw new BadRequestError('check_out_start cannot be later than check_out_end');
    }

    const id = await schoolSessionRepository.create(data);
    return this.getById(id);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    const startTime = data.start_time || existing.start_time;
    const lateAfter = data.late_after || existing.late_after;
    const endTime = data.end_time || existing.end_time;
    const checkOutStart = data.check_out_start !== undefined ? data.check_out_start : existing.check_out_start;
    const checkOutEnd = data.check_out_end !== undefined ? data.check_out_end : existing.check_out_end;

    if (compareTimes(startTime, lateAfter) > 0) {
      throw new BadRequestError('start_time cannot be later than late_after');
    }

    if (compareTimes(lateAfter, endTime) > 0) {
      throw new BadRequestError('late_after cannot be later than end_time');
    }

    if (checkOutStart && checkOutEnd && compareTimes(checkOutStart, checkOutEnd) > 0) {
      throw new BadRequestError('check_out_start cannot be later than check_out_end');
    }

    await schoolSessionRepository.update(id, data);
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await schoolSessionRepository.delete(id);
    return true;
  }
}

module.exports = new SchoolSessionService();
