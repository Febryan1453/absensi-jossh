const { pool } = require('../config/database');

class RoomRepository {
  async findById(id, conn = pool) {
    const sql = 'SELECT id, code, name, location, capacity, status, created_at, updated_at FROM rooms WHERE id = ? LIMIT 1';
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findByCode(code, conn = pool) {
    const sql = 'SELECT id, code, name, location, capacity, status, created_at, updated_at FROM rooms WHERE code = ? LIMIT 1';
    const [rows] = await conn.execute(sql, [code]);
    return rows[0] || null;
  }

  async findAll({ status, search, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = 'SELECT id, code, name, location, capacity, status, created_at, updated_at FROM rooms WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // LIMIT/OFFSET tidak boleh jadi placeholder pada prepared statement
    // MySQL 8 (mysql2 .execute) - nilainya di-coerce ke integer agar tetap aman.
    // Deterministic tie-breaker on the primary key: without it MySQL may repeat
    // or skip rows whose sort keys are equal when LIMIT/OFFSET spans pages.
    sql += ' ORDER BY name ASC, id ASC LIMIT ' + parseInt(limit, 10) + ' OFFSET ' + parseInt(offset, 10);

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ status, search } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM rooms WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create({ code, name, location = null, capacity = null, status = 'active' }, conn = pool) {
    const sql = 'INSERT INTO rooms (code, name, location, capacity, status) VALUES (?, ?, ?, ?, ?)';
    const [result] = await conn.execute(sql, [code, name, location, capacity, status]);
    return result.insertId;
  }

  async update(id, { code, name, location, capacity, status }, conn = pool) {
    const fields = [];
    const params = [];

    if (code !== undefined) {
      fields.push('code = ?');
      params.push(code);
    }
    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (location !== undefined) {
      fields.push('location = ?');
      params.push(location);
    }
    if (capacity !== undefined) {
      fields.push('capacity = ?');
      params.push(capacity);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE rooms SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM rooms WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new RoomRepository();
