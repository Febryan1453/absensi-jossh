const { pool } = require('../config/database');

class TeacherRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT 
        t.id, t.user_id, t.nip, t.phone, t.gender, t.birth_date, t.address, t.status, t.created_at, t.updated_at,
        u.uuid AS user_uuid, u.name, u.email, u.status AS user_status, u.last_login_at
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findByUserId(userId, conn = pool) {
    const sql = `
      SELECT 
        t.id, t.user_id, t.nip, t.phone, t.gender, t.birth_date, t.address, t.status, t.created_at, t.updated_at,
        u.uuid AS user_uuid, u.name, u.email, u.status AS user_status, u.last_login_at
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [userId]);
    return rows[0] || null;
  }

  async findByNip(nip, conn = pool) {
    const sql = `
      SELECT id, user_id, nip, phone, gender, birth_date, address, status, created_at, updated_at
      FROM teachers
      WHERE nip = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [nip]);
    return rows[0] || null;
  }

  async findAll({ status, gender, search, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT 
        t.id, t.user_id, t.nip, t.phone, t.gender, t.birth_date, t.address, t.status, t.created_at, t.updated_at,
        u.uuid AS user_uuid, u.name, u.email, u.status AS user_status
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (gender) {
      sql += ' AND t.gender = ?';
      params.push(gender);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR t.nip LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // LIMIT/OFFSET tidak boleh jadi placeholder pada prepared statement
    // MySQL 8 (mysql2 .execute) - nilainya di-coerce ke integer agar tetap aman.
    // Deterministic tie-breaker on the primary key: without it MySQL may repeat
    // or skip rows whose sort keys are equal when LIMIT/OFFSET spans pages.
    sql += ' ORDER BY u.name ASC, t.id ASC LIMIT ' + parseInt(limit, 10) + ' OFFSET ' + parseInt(offset, 10);

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ status, gender, search } = {}, conn = pool) {
    let sql = `
      SELECT COUNT(*) as total
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (gender) {
      sql += ' AND t.gender = ?';
      params.push(gender);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR t.nip LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create({ user_id, nip = null, phone = null, gender = null, birth_date = null, address = null, status = 'active' }, conn = pool) {
    const sql = `
      INSERT INTO teachers (user_id, nip, phone, gender, birth_date, address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      user_id,
      nip || null,
      phone || null,
      gender || null,
      birth_date || null,
      address || null,
      status
    ]);
    return result.insertId;
  }

  async update(id, { nip, phone, gender, birth_date, address, status }, conn = pool) {
    const fields = [];
    const params = [];

    if (nip !== undefined) {
      fields.push('nip = ?');
      params.push(nip);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      params.push(phone);
    }
    if (gender !== undefined) {
      fields.push('gender = ?');
      params.push(gender);
    }
    if (birth_date !== undefined) {
      fields.push('birth_date = ?');
      params.push(birth_date);
    }
    if (address !== undefined) {
      fields.push('address = ?');
      params.push(address);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE teachers SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM teachers WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new TeacherRepository();
