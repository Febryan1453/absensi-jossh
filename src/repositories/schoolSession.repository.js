const { pool } = require('../config/database');

class SchoolSessionRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT id, name, start_time, late_after, end_time, check_out_start, check_out_end, is_active, created_at, updated_at
      FROM school_sessions
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findActive(conn = pool) {
    const sql = `
      SELECT id, name, start_time, late_after, end_time, check_out_start, check_out_end, is_active, created_at, updated_at
      FROM school_sessions
      WHERE is_active = TRUE
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql);
    return rows[0] || null;
  }

  async findAll({ is_active, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT id, name, start_time, late_after, end_time, check_out_start, check_out_end, is_active, created_at, updated_at
      FROM school_sessions
      WHERE 1=1
    `;
    const params = [];

    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    // LIMIT/OFFSET tidak boleh jadi placeholder pada prepared statement
    // MySQL 8 (mysql2 .execute) - nilainya di-coerce ke integer agar tetap aman.
    // Deterministic tie-breaker on the primary key: without it MySQL may repeat
    // or skip rows whose sort keys are equal when LIMIT/OFFSET spans pages.
    sql += ' ORDER BY start_time ASC, id ASC LIMIT ' + parseInt(limit, 10) + ' OFFSET ' + parseInt(offset, 10);

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ is_active } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM school_sessions WHERE 1=1';
    const params = [];

    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create(data, conn = pool) {
    const sql = `
      INSERT INTO school_sessions (name, start_time, late_after, end_time, check_out_start, check_out_end, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      data.name,
      data.start_time,
      data.late_after,
      data.end_time,
      data.check_out_start || null,
      data.check_out_end || null,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    ]);
    return result.insertId;
  }

  async update(id, data, conn = pool) {
    const fields = [];
    const params = [];

    const allowed = ['name', 'start_time', 'late_after', 'end_time', 'check_out_start', 'check_out_end', 'is_active'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'is_active') {
          params.push(data[key] ? 1 : 0);
        } else {
          params.push(data[key] === '' ? null : data[key]);
        }
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE school_sessions SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM school_sessions WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new SchoolSessionRepository();
