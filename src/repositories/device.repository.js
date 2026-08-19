const { pool } = require('../config/database');

class DeviceRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT id, uuid, code, name, type, location, api_key, status, last_seen_at, created_at, updated_at
      FROM attendance_devices
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findByUuid(uuid, conn = pool) {
    const sql = `
      SELECT id, uuid, code, name, type, location, api_key, status, last_seen_at, created_at, updated_at
      FROM attendance_devices
      WHERE uuid = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [uuid]);
    return rows[0] || null;
  }

  async findByCode(code, conn = pool) {
    const sql = `
      SELECT id, uuid, code, name, type, location, api_key, status, last_seen_at, created_at, updated_at
      FROM attendance_devices
      WHERE code = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [code]);
    return rows[0] || null;
  }

  async findByApiKey(apiKey, conn = pool) {
    const sql = `
      SELECT id, uuid, code, name, type, location, api_key, status, last_seen_at, created_at, updated_at
      FROM attendance_devices
      WHERE api_key = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [apiKey]);
    return rows[0] || null;
  }

  async findAll({ status, type, search, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT id, uuid, code, name, type, location, status, last_seen_at, created_at, updated_at
      FROM attendance_devices
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // LIMIT/OFFSET tidak boleh jadi placeholder pada prepared statement
    // MySQL 8 (mysql2 .execute) - nilainya di-coerce ke integer agar tetap aman.
    sql += ' ORDER BY id DESC LIMIT ' + parseInt(limit, 10) + ' OFFSET ' + parseInt(offset, 10);

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ status, type, search } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM attendance_devices WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create(data, conn = pool) {
    const sql = `
      INSERT INTO attendance_devices (uuid, code, name, type, location, api_key, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      data.uuid,
      data.code,
      data.name,
      data.type || 'qr',
      data.location || null,
      data.api_key || null,
      data.status || 'active'
    ]);
    return result.insertId;
  }

  async update(id, data, conn = pool) {
    const fields = [];
    const params = [];

    const allowed = ['code', 'name', 'type', 'location', 'api_key', 'status'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key] === '' ? null : data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE attendance_devices SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async updateLastSeen(id, conn = pool) {
    const sql = 'UPDATE attendance_devices SET last_seen_at = NOW() WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM attendance_devices WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new DeviceRepository();
