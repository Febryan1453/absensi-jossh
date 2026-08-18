const { pool } = require('../config/database');

class StudentRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT 
        s.id, s.user_id, s.class_id, s.nis, s.nisn, s.gender, s.birth_place, s.birth_date,
        s.phone, s.address, s.photo, s.admission_date, s.graduation_date, s.status,
        s.created_at, s.updated_at,
        u.uuid AS user_uuid, u.name, u.email, u.status AS user_status,
        c.code AS class_code, c.name AS class_name, c.grade AS class_grade,
        ay.name AS academic_year_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE s.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findByUserId(userId, conn = pool) {
    const sql = `
      SELECT 
        s.id, s.user_id, s.class_id, s.nis, s.nisn, s.gender, s.birth_place, s.birth_date,
        s.phone, s.address, s.photo, s.admission_date, s.graduation_date, s.status,
        s.created_at, s.updated_at,
        u.uuid AS user_uuid, u.name, u.email, u.status AS user_status,
        c.code AS class_code, c.name AS class_name, c.grade AS class_grade,
        ay.name AS academic_year_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE s.user_id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [userId]);
    return rows[0] || null;
  }

  async findByNis(nis, conn = pool) {
    const sql = `
      SELECT id, user_id, class_id, nis, nisn, status
      FROM students
      WHERE nis = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [nis]);
    return rows[0] || null;
  }

  async findByNisn(nisn, conn = pool) {
    const sql = `
      SELECT id, user_id, class_id, nis, nisn, status
      FROM students
      WHERE nisn = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [nisn]);
    return rows[0] || null;
  }

  async findAll({ class_id, status, gender, search, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT 
        s.id, s.user_id, s.class_id, s.nis, s.nisn, s.gender, s.phone, s.status,
        s.created_at, s.updated_at,
        u.uuid AS user_uuid, u.name, u.email,
        c.code AS class_code, c.name AS class_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      sql += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    if (gender) {
      sql += ' AND s.gender = ?';
      params.push(gender);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR s.nis LIKE ? OR s.nisn LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY c.code ASC, u.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ class_id, status, gender, search } = {}, conn = pool) {
    let sql = `
      SELECT COUNT(*) as total
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      sql += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    if (gender) {
      sql += ' AND s.gender = ?';
      params.push(gender);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR s.nis LIKE ? OR s.nisn LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create(data, conn = pool) {
    const sql = `
      INSERT INTO students (
        user_id, class_id, nis, nisn, gender, birth_place, birth_date,
        phone, address, photo, admission_date, graduation_date, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      data.user_id,
      data.class_id,
      data.nis,
      data.nisn || null,
      data.gender || null,
      data.birth_place || null,
      data.birth_date || null,
      data.phone || null,
      data.address || null,
      data.photo || null,
      data.admission_date || null,
      data.graduation_date || null,
      data.status || 'active'
    ]);
    return result.insertId;
  }

  async update(id, data, conn = pool) {
    const fields = [];
    const params = [];

    const allowedFields = [
      'class_id', 'nis', 'nisn', 'gender', 'birth_place', 'birth_date',
      'phone', 'address', 'photo', 'admission_date', 'graduation_date', 'status'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field] === '' ? null : data[field]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM students WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async getParents(studentId, conn = pool) {
    const sql = `
      SELECT 
        p.id AS parent_id, p.user_id, p.nik, p.phone, p.gender, p.occupation,
        u.name, u.email,
        sp.id AS student_parent_id, sp.relationship, sp.is_primary,
        sp.can_view_attendance, sp.can_receive_notification
      FROM student_parents sp
      JOIN parents p ON sp.parent_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE sp.student_id = ?
    `;
    const [rows] = await conn.execute(sql, [studentId]);
    return rows;
  }
}

module.exports = new StudentRepository();
