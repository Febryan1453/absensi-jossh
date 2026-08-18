const { v4: uuidv4 } = require('uuid');
const studentRepository = require('../repositories/student.repository');
const userRepository = require('../repositories/user.repository');
const classRepository = require('../repositories/class.repository');
const { hashPassword } = require('../utils/hash');
const { withTransaction } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/appError');

class StudentService {
  async getAll(query) {
    const { class_id, status, gender, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      studentRepository.findAll({ class_id, status, gender, search, limit, offset }),
      studentRepository.countAll({ class_id, status, gender, search })
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
    const item = await studentRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Student with ID ${id} not found`);
    }

    const parents = await studentRepository.getParents(id);
    item.parents = parents;

    return item;
  }

  async create(data) {
    const {
      name, email, password = 'password', class_id, nis, nisn, gender,
      birth_place, birth_date, phone, address, photo, admission_date, graduation_date,
      status = 'active'
    } = data;

    // Verify class exists
    const classRecord = await classRepository.findById(class_id);
    if (!classRecord) {
      throw new NotFoundError(`Class with ID ${class_id} not found`);
    }

    if (email) {
      const existingUser = await userRepository.findByEmailWithPassword(email);
      if (existingUser) {
        throw new ConflictError('A user with this email already exists');
      }
    }

    // Check NIS uniqueness
    const existingNis = await studentRepository.findByNis(nis);
    if (existingNis) {
      throw new ConflictError(`Student with NIS '${nis}' already exists`);
    }

    // Check NISN uniqueness if provided
    if (nisn) {
      const existingNisn = await studentRepository.findByNisn(nisn);
      if (existingNisn) {
        throw new ConflictError(`Student with NISN '${nisn}' already exists`);
      }
    }

    const hashedPassword = await hashPassword(password);
    const userUuid = uuidv4();

    const studentId = await withTransaction(async (conn) => {
      const userId = await userRepository.create(
        {
          uuid: userUuid,
          name,
          email: email || null,
          password: hashedPassword,
          role: 'student',
          status: status === 'inactive' ? 'inactive' : 'active',
          email_verified_at: new Date()
        },
        conn
      );

      return studentRepository.create(
        {
          user_id: userId,
          class_id,
          nis,
          nisn: nisn || null,
          gender: gender || null,
          birth_place: birth_place || null,
          birth_date: birth_date || null,
          phone: phone || null,
          address: address || null,
          photo: photo || null,
          admission_date: admission_date || null,
          graduation_date: graduation_date || null,
          status
        },
        conn
      );
    });

    return this.getById(studentId);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    if (data.class_id && data.class_id !== existing.class_id) {
      const classRecord = await classRepository.findById(data.class_id);
      if (!classRecord) {
        throw new NotFoundError(`Class with ID ${data.class_id} not found`);
      }
    }

    if (data.nis && data.nis !== existing.nis) {
      const duplicate = await studentRepository.findByNis(data.nis);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        throw new ConflictError(`Student with NIS '${data.nis}' already exists`);
      }
    }

    if (data.nisn && data.nisn !== existing.nisn) {
      const duplicateNisn = await studentRepository.findByNisn(data.nisn);
      if (duplicateNisn && duplicateNisn.id !== parseInt(id, 10)) {
        throw new ConflictError(`Student with NISN '${data.nisn}' already exists`);
      }
    }

    if (data.email && data.email !== existing.email) {
      const duplicateUser = await userRepository.findByEmailWithPassword(data.email);
      if (duplicateUser && duplicateUser.id !== existing.user_id) {
        throw new ConflictError('Email address is already in use by another user');
      }
    }

    await withTransaction(async (conn) => {
      if (data.name !== undefined || data.email !== undefined || data.status !== undefined) {
        await userRepository.update(
          existing.user_id,
          {
            name: data.name,
            email: data.email,
            status: data.status === 'inactive' ? 'inactive' : 'active'
          },
          conn
        );
      }

      await studentRepository.update(id, data, conn);
    });

    return this.getById(id);
  }

  async delete(id) {
    const existing = await this.getById(id);
    await withTransaction(async (conn) => {
      await studentRepository.delete(id, conn);
      await userRepository.delete(existing.user_id, conn);
    });
    return true;
  }
}

module.exports = new StudentService();
