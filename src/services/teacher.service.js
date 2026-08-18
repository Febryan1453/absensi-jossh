const { v4: uuidv4 } = require('uuid');
const teacherRepository = require('../repositories/teacher.repository');
const userRepository = require('../repositories/user.repository');
const { hashPassword } = require('../utils/hash');
const { withTransaction } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/appError');

class TeacherService {
  async getAll(query) {
    const { status, gender, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      teacherRepository.findAll({ status, gender, search, limit, offset }),
      teacherRepository.countAll({ status, gender, search })
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
    const item = await teacherRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Teacher with ID ${id} not found`);
    }
    return item;
  }

  async create(data) {
    const { name, email, password = 'password', nip, phone, gender, birth_date, address, status = 'active' } = data;

    if (email) {
      const existingUser = await userRepository.findByEmailWithPassword(email);
      if (existingUser) {
        throw new ConflictError('A user with this email already exists');
      }
    }

    if (nip) {
      const existingNip = await teacherRepository.findByNip(nip);
      if (existingNip) {
        throw new ConflictError(`Teacher with NIP '${nip}' already exists`);
      }
    }

    const hashedPassword = await hashPassword(password);
    const userUuid = uuidv4();

    const teacherId = await withTransaction(async (conn) => {
      const userId = await userRepository.create(
        {
          uuid: userUuid,
          name,
          email: email || null,
          password: hashedPassword,
          role: 'teacher',
          status,
          email_verified_at: new Date()
        },
        conn
      );

      return teacherRepository.create(
        {
          user_id: userId,
          nip: nip || null,
          phone: phone || null,
          gender: gender || null,
          birth_date: birth_date || null,
          address: address || null,
          status
        },
        conn
      );
    });

    return this.getById(teacherId);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    if (data.nip && data.nip !== existing.nip) {
      const duplicate = await teacherRepository.findByNip(data.nip);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        throw new ConflictError(`Teacher with NIP '${data.nip}' already exists`);
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
            status: data.status
          },
          conn
        );
      }

      await teacherRepository.update(
        id,
        {
          nip: data.nip,
          phone: data.phone,
          gender: data.gender,
          birth_date: data.birth_date,
          address: data.address,
          status: data.status
        },
        conn
      );
    });

    return this.getById(id);
  }

  async delete(id) {
    const existing = await this.getById(id);
    await withTransaction(async (conn) => {
      await teacherRepository.delete(id, conn);
      await userRepository.delete(existing.user_id, conn);
    });
    return true;
  }
}

module.exports = new TeacherService();
