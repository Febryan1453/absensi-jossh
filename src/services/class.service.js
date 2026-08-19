const classRepository = require('../repositories/class.repository');
const academicYearRepository = require('../repositories/academicYear.repository');
const teacherRepository = require('../repositories/teacher.repository');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/appError');

class ClassService {
  async getAll(query) {
    const { academic_year_id, grade, status, search, page = 1, limit = 20 } = query;

    // Validate pagination parameters
    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (!Number.isInteger(pageNum) || pageNum < 1 || !Number.isInteger(limitNum) || limitNum < 1) {
      throw new BadRequestError('Invalid pagination parameters');
    }

    const offset = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      classRepository.findAll({ academic_year_id, grade, status, search, limit: limitNum, offset }),
      classRepository.countAll({ academic_year_id, grade, status, search })
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
    const item = await classRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Class with ID ${id} not found`);
    }
    return item;
  }

  async create(data) {
    // Verify academic year exists
    const academicYear = await academicYearRepository.findById(data.academic_year_id);
    if (!academicYear) {
      throw new NotFoundError(`Academic year with ID ${data.academic_year_id} not found`);
    }

    // Verify homeroom teacher exists if specified
    if (data.homeroom_teacher_id) {
      const teacher = await teacherRepository.findById(data.homeroom_teacher_id);
      if (!teacher) {
        throw new NotFoundError(`Teacher with ID ${data.homeroom_teacher_id} not found`);
      }
    }

    // Check unique class code per academic year
    const existing = await classRepository.findByCodeAndYear(data.academic_year_id, data.code);
    if (existing) {
      throw new ConflictError(`Class code '${data.code}' already exists for this academic year`);
    }

    const id = await classRepository.create(data);
    return this.getById(id);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    const academicYearId = data.academic_year_id || existing.academic_year_id;
    const code = data.code || existing.code;

    if (data.academic_year_id && data.academic_year_id !== existing.academic_year_id) {
      const academicYear = await academicYearRepository.findById(data.academic_year_id);
      if (!academicYear) {
        throw new NotFoundError(`Academic year with ID ${data.academic_year_id} not found`);
      }
    }

    if (data.homeroom_teacher_id && data.homeroom_teacher_id !== existing.homeroom_teacher_id) {
      const teacher = await teacherRepository.findById(data.homeroom_teacher_id);
      if (!teacher) {
        throw new NotFoundError(`Teacher with ID ${data.homeroom_teacher_id} not found`);
      }
    }

    if ((data.code && data.code !== existing.code) || (data.academic_year_id && data.academic_year_id !== existing.academic_year_id)) {
      const duplicate = await classRepository.findByCodeAndYear(academicYearId, code);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        throw new ConflictError(`Class code '${code}' already exists for this academic year`);
      }
    }

    await classRepository.update(id, data);
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await classRepository.delete(id);
    return true;
  }
}

module.exports = new ClassService();
