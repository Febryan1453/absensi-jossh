const academicYearRepository = require('../repositories/academicYear.repository');
const { withTransaction } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/appError');

class AcademicYearService {
  async getAll(query) {
    const { is_active, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const isActiveFilter = is_active !== undefined ? is_active === 'true' || is_active === true : undefined;

    const [items, total] = await Promise.all([
      academicYearRepository.findAll({ is_active: isActiveFilter, limit, offset }),
      academicYearRepository.countAll({ is_active: isActiveFilter })
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
    const item = await academicYearRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Academic year with ID ${id} not found`);
    }
    return item;
  }

  async getActive() {
    const item = await academicYearRepository.findActive();
    if (!item) {
      throw new NotFoundError('No active academic year found');
    }
    return item;
  }

  async create(data) {
    const { name, start_date, end_date, is_active } = data;

    const existing = await academicYearRepository.findByName(name);
    if (existing) {
      throw new ConflictError(`Academic year with name '${name}' already exists`);
    }

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError('start_date must be earlier than end_date');
    }

    // Atomic transaction if activating
    const id = await withTransaction(async (conn) => {
      if (is_active) {
        await academicYearRepository.setAllInactive(conn);
      }
      return academicYearRepository.create(
        {
          name,
          start_date,
          end_date,
          is_active: Boolean(is_active)
        },
        conn
      );
    });

    return this.getById(id);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    if (data.name && data.name !== existing.name) {
      const duplicate = await academicYearRepository.findByName(data.name);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        throw new ConflictError(`Academic year with name '${data.name}' already exists`);
      }
    }

    const startDate = data.start_date || existing.start_date;
    const endDate = data.end_date || existing.end_date;

    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestError('start_date must be earlier than end_date');
    }

    await withTransaction(async (conn) => {
      if (data.is_active) {
        await academicYearRepository.setAllInactive(conn);
      }
      await academicYearRepository.update(id, data, conn);
    });

    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await academicYearRepository.delete(id);
    return true;
  }
}

module.exports = new AcademicYearService();
