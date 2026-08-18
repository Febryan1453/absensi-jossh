const { pool } = require('../config/database');

class ParentRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT 
        p.id, p.user_id, p.nik, p.phone, p.gender, p.address, p.occupation, p.status,
        p.created_at, p.updated_at,
        u.uuid AS user_uuid, u.name, u.email, u.status AS user_status
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findByUserId(userId, conn = pool) {
    const sql = `
      SELECT 
        p.id, p.user_id, p.nik, p.phone, p.gender, p.address, p.occupation, p.status,
        p.created_at, p.updated_at,
        u.uuid AS user_uuid, u.name, u.email, u.status AS user_status
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [userId]);
    return rows[0] || null;
  }

  async findByNik(nik, conn = pool) {
    const sql = 'SELECT id, user_id, nik, status FROM parents WHERE nik = ? LIMIT 1';
    const [rows] = await conn.execute(sql, [nik]);
    return rows[0] || null;
  }

  async findAll({ status, gender, search, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT 
        p.id, p.user_id, p.nik, p.phone, p.gender, p.occupation, p.status,
        p.created_at, p.updated_at,
        u.uuid AS user_uuid, u.name, u.email
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (gender) {
      sql += ' AND p.gender = ?';
      params.push(gender);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR p.nik LIKE ? OR u.email LIKE ? OR p.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY u.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ status, gender, search } = {}, conn = pool) {
    let sql = `
      SELECT COUNT(*) as total
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (gender) {
      sql += ' AND p.gender = ?';
      params.push(gender);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR p.nik LIKE ? OR u.email LIKE ? OR p.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create({ user_id, nik = null, phone = null, gender = null, address = null, occupation = null, status = 'active' }, conn = pool) {
    const sql = `
      INSERT INTO parents (user_id, nik, phone, gender, address, occupation, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      user_id,
      nik || null,
      phone || null,
      gender || null,
      address || null,
      occupation || null,
      status
    ]);
    return result.insertId;
  }

  async update(id, { nik, phone, gender, address, occupation, status }, conn = pool) {
    const fields = [];
    const params = [];

    if (nik !== undefined) {
      fields.push('nik = ?');
      params.push(nik);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      params.push(phone);
    }
    if (gender !== undefined) {
      fields.push('gender = ?');
      params.push(gender);
    }
    if (address !== undefined) {
      fields.push('address = ?');
      params.push(address);
    }
    if (occupation !== undefined) {
      fields.push('occupation = ?');
      params.push(occupation);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE parents SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM parents WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async getChildren(parentId, conn = pool) {
    const sql = `
      SELECT 
        s.id AS student_id, s.nis, s.nisn, s.gender, s.photo, s.status AS student_status,
        u.name AS student_name, u.email AS student_email,
        c.id AS class_id, c.code AS class_code, c.name AS class_name,
        sp.id AS student_parent_id, sp.relationship, sp.is_primary,
        sp.can_view_attendance, sp.can_receive_notification
      FROM student_parents sp
      JOIN students s ON sp.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE sp.parent_id = ?
    `;
    const [rows] = await conn.execute(sql, [parentId]);
    return rows;
  }
}

module.exports = new ParentRepository();
