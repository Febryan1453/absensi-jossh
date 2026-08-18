const { pool } = require('../config/database');

class AcademicYearRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT id, name, start_date, end_date, is_active, created_at, updated_at
      FROM academic_years
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findActive(conn = pool) {
    const sql = `
      SELECT id, name, start_date, end_date, is_active, created_at, updated_at
      FROM academic_years
      WHERE is_active = TRUE
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql);
    return rows[0] || null;
  }

  async findByName(name, conn = pool) {
    const sql = `
      SELECT id, name, start_date, end_date, is_active, created_at, updated_at
      FROM academic_years
      WHERE name = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [name]);
    return rows[0] || null;
  }

  async findAll({ is_active, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = 'SELECT id, name, start_date, end_date, is_active, created_at, updated_at FROM academic_years WHERE 1=1';
    const params = [];

    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    sql += ' ORDER BY start_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ is_active } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM academic_years WHERE 1=1';
    const params = [];

    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create({ name, start_date, end_date, is_active = false }, conn = pool) {
    const sql = `
      INSERT INTO academic_years (name, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [name, start_date, end_date, is_active ? 1 : 0]);
    return result.insertId;
  }

  async update(id, { name, start_date, end_date, is_active }, conn = pool) {
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (start_date !== undefined) {
      fields.push('start_date = ?');
      params.push(start_date);
    }
    if (end_date !== undefined) {
      fields.push('end_date = ?');
      params.push(end_date);
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE academic_years SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async setAllInactive(conn = pool) {
    const sql = 'UPDATE academic_years SET is_active = FALSE WHERE is_active = TRUE';
    const [result] = await conn.execute(sql);
    return result.affectedRows;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM academic_years WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new AcademicYearRepository();
