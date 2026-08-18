const { v4: uuidv4 } = require('uuid');
const parentRepository = require('../repositories/parent.repository');
const studentRepository = require('../repositories/student.repository');
const studentParentRepository = require('../repositories/studentParent.repository');
const userRepository = require('../repositories/user.repository');
const { hashPassword } = require('../utils/hash');
const { withTransaction } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/appError');

class ParentService {
  async getAll(query) {
    const { status, gender, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      parentRepository.findAll({ status, gender, search, limit, offset }),
      parentRepository.countAll({ status, gender, search })
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
    const item = await parentRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Parent with ID ${id} not found`);
    }

    item.children = await parentRepository.getChildren(id);
    return item;
  }

  async create(data) {
    const { name, email, password = 'password', nik, phone, gender, address, occupation, status = 'active' } = data;

    if (email) {
      const existingUser = await userRepository.findByEmailWithPassword(email);
      if (existingUser) {
        throw new ConflictError('A user with this email already exists');
      }
    }

    if (nik) {
      const existingNik = await parentRepository.findByNik(nik);
      if (existingNik) {
        throw new ConflictError(`Parent with NIK '${nik}' already exists`);
      }
    }

    const hashedPassword = await hashPassword(password);
    const userUuid = uuidv4();

    const parentId = await withTransaction(async (conn) => {
      const userId = await userRepository.create(
        {
          uuid: userUuid,
          name,
          email: email || null,
          password: hashedPassword,
          role: 'parent',
          status,
          email_verified_at: new Date()
        },
        conn
      );

      return parentRepository.create(
        {
          user_id: userId,
          nik: nik || null,
          phone: phone || null,
          gender: gender || null,
          address: address || null,
          occupation: occupation || null,
          status
        },
        conn
      );
    });

    return this.getById(parentId);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    if (data.nik && data.nik !== existing.nik) {
      const duplicate = await parentRepository.findByNik(data.nik);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        throw new ConflictError(`Parent with NIK '${data.nik}' already exists`);
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

      await parentRepository.update(id, data, conn);
    });

    return this.getById(id);
  }

  async delete(id) {
    const existing = await this.getById(id);
    await withTransaction(async (conn) => {
      await parentRepository.delete(id, conn);
      await userRepository.delete(existing.user_id, conn);
    });
    return true;
  }

  /**
   * Link a student to a parent
   */
  async linkStudent(parentId, studentId, linkData) {
    await this.getById(parentId);

    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError(`Student with ID ${studentId} not found`);
    }

    const existingLink = await studentParentRepository.findByStudentAndParent(studentId, parentId);
    if (existingLink) {
      throw new ConflictError('Student is already linked to this parent');
    }

    const linkId = await studentParentRepository.create({
      student_id: studentId,
      parent_id: parentId,
      relationship: linkData.relationship || 'father',
      is_primary: linkData.is_primary || false,
      can_view_attendance: linkData.can_view_attendance !== undefined ? linkData.can_view_attendance : true,
      can_receive_notification: linkData.can_receive_notification !== undefined ? linkData.can_receive_notification : true
    });

    return studentParentRepository.findById(linkId);
  }

  /**
   * Unlink a student from a parent
   */
  async unlinkStudent(parentId, studentId) {
    await this.getById(parentId);

    const existingLink = await studentParentRepository.findByStudentAndParent(studentId, parentId);
    if (!existingLink) {
      throw new NotFoundError('Link between this student and parent does not exist');
    }

    await studentParentRepository.delete(existingLink.id);
    return true;
  }
}

module.exports = new ParentService();
