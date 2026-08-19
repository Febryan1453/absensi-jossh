const { pool } = require('../config/database');

class ClassRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT 
        c.id, c.academic_year_id, c.code, c.name, c.grade, c.major, 
        c.homeroom_teacher_id, c.status, c.created_at, c.updated_at,
        ay.name AS academic_year_name, ay.is_active AS academic_year_is_active,
        t.nip AS homeroom_teacher_nip,
        u.name AS homeroom_teacher_name,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS total_students
      FROM classes c
      JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE c.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findByCodeAndYear(academic_year_id, code, conn = pool) {
    const sql = `
      SELECT id, academic_year_id, code, name, grade, major, homeroom_teacher_id, status, created_at, updated_at
      FROM classes
      WHERE academic_year_id = ? AND code = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [academic_year_id, code]);
    return rows[0] || null;
  }

  async findAll({ academic_year_id, grade, status, search, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT 
        c.id, c.academic_year_id, c.code, c.name, c.grade, c.major, 
        c.homeroom_teacher_id, c.status, c.created_at, c.updated_at,
        ay.name AS academic_year_name,
        t.nip AS homeroom_teacher_nip,
        u.name AS homeroom_teacher_name,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS total_students
      FROM classes c
      JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (academic_year_id) {
      sql += ' AND c.academic_year_id = ?';
      params.push(academic_year_id);
    }
    if (grade) {
      sql += ' AND c.grade = ?';
      params.push(grade);
    }
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (c.name LIKE ? OR c.code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY c.grade ASC, c.name ASC LIMIT ? OFFSET ?';
    // Ensure limit and offset are valid integers; fallback to defaults (20,0)
    const safeLimit = Number.isInteger(parseInt(limit, 10)) && parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 20;
    const safeOffset = Number.isInteger(parseInt(offset, 10)) && parseInt(offset, 10) >= 0 ? parseInt(offset, 10) : 0;
    params.push(safeLimit, safeOffset);

    // Development‑only debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('SQL (findAll):', sql);
      console.log('Params (findAll):', params);
    }

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ academic_year_id, grade, status, search } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM classes c WHERE 1=1';
    const params = [];

    if (academic_year_id) {
      sql += ' AND c.academic_year_id = ?';
      params.push(academic_year_id);
    }
    if (grade) {
      sql += ' AND c.grade = ?';
      params.push(grade);
    }
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (c.name LIKE ? OR c.code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create({ academic_year_id, code, name, grade = null, major = null, homeroom_teacher_id = null, status = 'active' }, conn = pool) {
    const sql = `
      INSERT INTO classes (academic_year_id, code, name, grade, major, homeroom_teacher_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      academic_year_id,
      code,
      name,
      grade,
      major,
      homeroom_teacher_id || null,
      status
    ]);
    return result.insertId;
  }

  async update(id, { academic_year_id, code, name, grade, major, homeroom_teacher_id, status }, conn = pool) {
    const fields = [];
    const params = [];

    if (academic_year_id !== undefined) {
      fields.push('academic_year_id = ?');
      params.push(academic_year_id);
    }
    if (code !== undefined) {
      fields.push('code = ?');
      params.push(code);
    }
    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (grade !== undefined) {
      fields.push('grade = ?');
      params.push(grade);
    }
    if (major !== undefined) {
      fields.push('major = ?');
      params.push(major);
    }
    if (homeroom_teacher_id !== undefined) {
      fields.push('homeroom_teacher_id = ?');
      params.push(homeroom_teacher_id || null);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM classes WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new ClassRepository();
