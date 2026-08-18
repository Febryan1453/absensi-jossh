const { pool } = require('../config/database');

class StudentParentRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT id, student_id, parent_id, relationship, is_primary, can_view_attendance, can_receive_notification, created_at, updated_at
      FROM student_parents
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findByStudentAndParent(studentId, parentId, conn = pool) {
    const sql = `
      SELECT id, student_id, parent_id, relationship, is_primary, can_view_attendance, can_receive_notification, created_at, updated_at
      FROM student_parents
      WHERE student_id = ? AND parent_id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [studentId, parentId]);
    return rows[0] || null;
  }

  async findParentsForNotification(studentId, conn = pool) {
    const sql = `
      SELECT 
        sp.parent_id, sp.relationship, sp.can_receive_notification,
        p.phone, p.user_id,
        u.name AS parent_name, u.email AS parent_email
      FROM student_parents sp
      JOIN parents p ON sp.parent_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE sp.student_id = ? AND sp.can_receive_notification = TRUE AND p.status = 'active'
    `;
    const [rows] = await conn.execute(sql, [studentId]);
    return rows;
  }

  async create({ student_id, parent_id, relationship, is_primary = false, can_view_attendance = true, can_receive_notification = true }, conn = pool) {
    const sql = `
      INSERT INTO student_parents (student_id, parent_id, relationship, is_primary, can_view_attendance, can_receive_notification)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      student_id,
      parent_id,
      relationship,
      is_primary ? 1 : 0,
      can_view_attendance ? 1 : 0,
      can_receive_notification ? 1 : 0
    ]);
    return result.insertId;
  }

  async update(id, { relationship, is_primary, can_view_attendance, can_receive_notification }, conn = pool) {
    const fields = [];
    const params = [];

    if (relationship !== undefined) {
      fields.push('relationship = ?');
      params.push(relationship);
    }
    if (is_primary !== undefined) {
      fields.push('is_primary = ?');
      params.push(is_primary ? 1 : 0);
    }
    if (can_view_attendance !== undefined) {
      fields.push('can_view_attendance = ?');
      params.push(can_view_attendance ? 1 : 0);
    }
    if (can_receive_notification !== undefined) {
      fields.push('can_receive_notification = ?');
      params.push(can_receive_notification ? 1 : 0);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE student_parents SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM student_parents WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async deleteByStudentAndParent(studentId, parentId, conn = pool) {
    const sql = 'DELETE FROM student_parents WHERE student_id = ? AND parent_id = ?';
    const [result] = await conn.execute(sql, [studentId, parentId]);
    return result.affectedRows > 0;
  }
}

module.exports = new StudentParentRepository();
