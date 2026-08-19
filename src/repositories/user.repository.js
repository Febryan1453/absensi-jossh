const { pool } = require('../config/database');

const ROLES = ['admin', 'teacher', 'student', 'parent'];

/**
 * Accept either a single role or a comma separated list ('admin,teacher').
 *
 * Staff administration needs administrators and teachers in one list; asking
 * the caller to make two paginated requests and merge them would give a page
 * count that is wrong on every page.
 *
 * Values are checked against the enum rather than passed through. They already
 * travel as bound parameters, but the list is also interpolated into the IN
 * clause as placeholders, and a filter that silently accepts unknown roles
 * returns an empty list with no indication of why.
 */
function normalizeRoles(role) {
  if (!role) return [];
  const raw = Array.isArray(role) ? role : String(role).split(',');
  return raw.map((r) => String(r).trim().toLowerCase()).filter((r) => ROLES.includes(r));
}

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
    // Lihat catatan konvensi waktu di config/database.js: koneksi memakai
    // timezone '+00:00', jadi waktu ditulis sebagai objek Date agar mysql2
    // yang mengubahnya ke UTC. NOW() akan menulis jam lokal server dan
    // membuat nilainya terbaca tujuh jam di masa depan.
    const sql = 'UPDATE users SET last_login_at = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [new Date(), id]);
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

    const roles = normalizeRoles(role);
    if (roles.length) {
      sql += ` AND role IN (${roles.map(() => '?').join(', ')})`;
      params.push(...roles);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // LIMIT/OFFSET tidak boleh jadi placeholder pada prepared statement
    // MySQL 8 (mysql2 .execute) - nilainya di-coerce ke integer agar tetap aman.
    sql += ' ORDER BY id DESC LIMIT ' + parseInt(limit, 10) + ' OFFSET ' + parseInt(offset, 10);

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  /**
   * Count users matching filter
   */
  async countAll({ role, status, search } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];

    const roles = normalizeRoles(role);
    if (roles.length) {
      sql += ` AND role IN (${roles.map(() => '?').join(', ')})`;
      params.push(...roles);
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
