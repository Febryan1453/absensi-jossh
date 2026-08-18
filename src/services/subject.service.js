const subjectRepository = require('../repositories/subject.repository');
const { NotFoundError, ConflictError } = require('../utils/appError');

class SubjectService {
  async getAll(query) {
    const { status, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      subjectRepository.findAll({ status, search, limit, offset }),
      subjectRepository.countAll({ status, search })
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
    const item = await subjectRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Subject with ID ${id} not found`);
    }
    return item;
  }

  async create(data) {
    const existing = await subjectRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError(`Subject with code '${data.code}' already exists`);
    }

    const id = await subjectRepository.create(data);
    return this.getById(id);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    if (data.code && data.code !== existing.code) {
      const duplicate = await subjectRepository.findByCode(data.code);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        throw new ConflictError(`Subject with code '${data.code}' already exists`);
      }
    }

    await subjectRepository.update(id, data);
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await subjectRepository.delete(id);
    return true;
  }
}

module.exports = new SubjectService();
