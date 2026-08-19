const { pool } = require('../config/database');

class NotificationRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT 
        an.id, an.student_attendance_id, an.parent_id, an.type, an.channel,
        an.status, an.title, an.message, an.sent_at, an.read_at, an.error_message,
        an.created_at, an.updated_at,
        u.name AS parent_name, u.email AS parent_email,
        s.nis AS student_nis, stu_u.name AS student_name
      FROM attendance_notifications an
      JOIN parents p ON an.parent_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN student_attendances sa ON an.student_attendance_id = sa.id
      JOIN students s ON sa.student_id = s.id
      JOIN users stu_u ON s.user_id = stu_u.id
      WHERE an.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findAll({ parent_id, student_attendance_id, status, type, channel, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT
        an.id, an.student_attendance_id, an.parent_id, an.type, an.channel,
        an.status, an.title, an.message, an.sent_at, an.read_at, an.error_message,
        an.created_at, an.updated_at,
        u.name AS parent_name, u.email AS parent_email, p.phone AS parent_phone,
        s.nis AS student_nis, stu_u.name AS student_name
      FROM attendance_notifications an
      JOIN parents p ON an.parent_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN student_attendances sa ON an.student_attendance_id = sa.id
      JOIN students s ON sa.student_id = s.id
      JOIN users stu_u ON s.user_id = stu_u.id
      WHERE 1=1
    `;
    const params = [];

    if (parent_id) {
      sql += ' AND an.parent_id = ?';
      params.push(parent_id);
    }
    if (student_attendance_id) {
      sql += ' AND an.student_attendance_id = ?';
      params.push(student_attendance_id);
    }
    if (status) {
      sql += ' AND an.status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND an.type = ?';
      params.push(type);
    }
    // The WhatsApp log screen needs only the whatsapp rows. Without this filter
    // the client had to fetch every channel and filter locally, which also made
    // meta.total report a number that did not match what was displayed.
    if (channel) {
      sql += ' AND an.channel = ?';
      params.push(channel);
    }

    // LIMIT/OFFSET tidak boleh jadi placeholder pada prepared statement
    // MySQL 8 (mysql2 .execute) - nilainya di-coerce ke integer agar tetap aman.
    //
    // an.id breaks ties on created_at: rows sharing a timestamp are otherwise
    // free to move between pages, so one notification can be listed twice while
    // another never appears at all.
    sql += ' ORDER BY an.created_at DESC, an.id DESC LIMIT ' + parseInt(limit, 10) + ' OFFSET ' + parseInt(offset, 10);

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ parent_id, student_attendance_id, status, type, channel } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM attendance_notifications an WHERE 1=1';
    const params = [];

    if (parent_id) {
      sql += ' AND an.parent_id = ?';
      params.push(parent_id);
    }
    if (student_attendance_id) {
      sql += ' AND an.student_attendance_id = ?';
      params.push(student_attendance_id);
    }
    if (status) {
      sql += ' AND an.status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND an.type = ?';
      params.push(type);
    }
    // Must mirror findAll's filters exactly. If the count ignores a filter the
    // list applies, meta.total reports the whole table while the page shows a
    // subset -- pagination then invents pages that render empty.
    if (channel) {
      sql += ' AND an.channel = ?';
      params.push(channel);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async countUnreadByParent(parentId, conn = pool) {
    const sql = "SELECT COUNT(*) as total FROM attendance_notifications WHERE parent_id = ? AND status != 'read'";
    const [rows] = await conn.execute(sql, [parentId]);
    return rows[0].total;
  }

  async create(data, conn = pool) {
    const sql = `
      INSERT INTO attendance_notifications (
        student_attendance_id, parent_id, type, channel, status,
        title, message, sent_at, read_at, error_message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      data.student_attendance_id,
      data.parent_id,
      data.type,
      data.channel || 'web',
      data.status || 'pending',
      data.title || null,
      data.message || null,
      data.sent_at || null,
      data.read_at || null,
      data.error_message || null
    ]);
    return result.insertId;
  }

  async createMany(items = [], conn = pool) {
    if (items.length === 0) return 0;

    let affected = 0;
    for (const item of items) {
      await this.create(item, conn);
      affected++;
    }
    return affected;
  }

  async markAsRead(id, conn = pool) {
    const sql = "UPDATE attendance_notifications SET status = 'read', read_at = NOW() WHERE id = ?";
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async markAllAsReadByParent(parentId, conn = pool) {
    const sql = "UPDATE attendance_notifications SET status = 'read', read_at = NOW() WHERE parent_id = ? AND status != 'read'";
    const [result] = await conn.execute(sql, [parentId]);
    return result.affectedRows;
  }
}

module.exports = new NotificationRepository();
