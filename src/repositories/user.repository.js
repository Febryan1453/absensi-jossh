const { pool } = require('../config/database');

class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id, conn = pool) {
    const sql = `
      SELECT id, uuid, name, email, role, status, email_verified_at, last_login_at, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Find user by email (includes password for login verification)
   */
  async findByEmailWithPassword(email, conn = pool) {
    const sql = `
      SELECT id, uuid, name, email, password, role, status, email_verified_at, last_login_at, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [email]);
    return rows[0] || null;
  }

  /**
   * Find user by UUID
   */
  async findByUuid(uuid, conn = pool) {
    const sql = `
      SELECT id, uuid, name, email, role, status, email_verified_at, last_login_at, created_at, updated_at
      FROM users
      WHERE uuid = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [uuid]);
    return rows[0] || null;
  }

  /**
   * Create new user record
   */
  async create({ uuid, name, email, password, role, status = 'active', email_verified_at = null }, conn = pool) {
    const sql = `
      INSERT INTO users (uuid, name, email, password, role, status, email_verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      uuid,
      name,
      email || null,
      password || null,
      role,
      status,
      email_verified_at
    ]);
    return result.insertId;
  }

  /**
   * Update user details
   */
  async update(id, { name, email, password, role, status }, conn = pool) {
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email);
    }
    if (password !== undefined) {
      fields.push('password = ?');
      params.push(password);
    }
    if (role !== undefined) {
      fields.push('role = ?');
      params.push(role);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id, conn = pool) {
    const sql = 'UPDATE users SET last_login_at = NOW() WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Delete user by ID
   */
  async delete(id, conn = pool) {
    const sql = 'DELETE FROM users WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Find all users with pagination and filtering
   */
  async findAll({ role, status, search, limit = 20, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT id, uuid, name, email, role, status, email_verified_at, last_login_at, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  /**
   * Count users matching filter
   */
  async countAll({ role, status, search } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }
}

module.exports = new UserRepository();
