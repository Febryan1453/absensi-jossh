const { pool } = require('../config/database');

class TeacherAttendanceRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT 
        ta.id, ta.teaching_schedule_id, ta.teacher_id, ta.check_in_at, ta.check_out_at,
        ta.status, ta.method, ta.device_id, ta.note, ta.created_at, ta.updated_at,
        t.nip, u.name AS teacher_name, u.email AS teacher_email,
        ts.date AS schedule_date, ts.start_time AS schedule_start_time, ts.end_time AS schedule_end_time,
        sub.name AS subject_name, c.name AS class_name, r.name AS room_name,
        d.name AS device_name
      FROM teacher_attendances ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN teaching_schedules ts ON ta.teaching_schedule_id = ts.id
      JOIN subjects sub ON ts.subject_id = sub.id
      JOIN classes c ON ts.class_id = c.id
      LEFT JOIN rooms r ON ts.room_id = r.id
      LEFT JOIN attendance_devices d ON ta.device_id = d.id
      WHERE ta.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findByScheduleId(scheduleId, conn = pool) {
    const sql = `
      SELECT 
        ta.id, ta.teaching_schedule_id, ta.teacher_id, ta.check_in_at, ta.check_out_at,
        ta.status, ta.method, ta.device_id, ta.note, ta.created_at, ta.updated_at,
        t.nip, u.name AS teacher_name
      FROM teacher_attendances ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE ta.teaching_schedule_id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [scheduleId]);
    return rows[0] || null;
  }

  async findAll({ teacher_id, date, status, search, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT 
        ta.id, ta.teaching_schedule_id, ta.teacher_id, ta.check_in_at, ta.check_out_at,
        ta.status, ta.method, ta.device_id, ta.note, ta.created_at, ta.updated_at,
        t.nip, u.name AS teacher_name,
        ts.date AS schedule_date, ts.start_time AS schedule_start_time, ts.end_time AS schedule_end_time,
        sub.name AS subject_name, c.name AS class_name
      FROM teacher_attendances ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN teaching_schedules ts ON ta.teaching_schedule_id = ts.id
      JOIN subjects sub ON ts.subject_id = sub.id
      JOIN classes c ON ts.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (teacher_id) {
      sql += ' AND ta.teacher_id = ?';
      params.push(teacher_id);
    }
    if (date) {
      sql += ' AND ts.date = ?';
      params.push(date);
    }
    if (status) {
      sql += ' AND ta.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR t.nip LIKE ? OR sub.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY ts.date DESC, ts.start_time ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ teacher_id, date, status, search } = {}, conn = pool) {
    let sql = `
      SELECT COUNT(*) as total
      FROM teacher_attendances ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN teaching_schedules ts ON ta.teaching_schedule_id = ts.id
      JOIN subjects sub ON ts.subject_id = sub.id
      WHERE 1=1
    `;
    const params = [];

    if (teacher_id) {
      sql += ' AND ta.teacher_id = ?';
      params.push(teacher_id);
    }
    if (date) {
      sql += ' AND ts.date = ?';
      params.push(date);
    }
    if (status) {
      sql += ' AND ta.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR t.nip LIKE ? OR sub.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create(data, conn = pool) {
    const sql = `
      INSERT INTO teacher_attendances (
        teaching_schedule_id, teacher_id, check_in_at, check_out_at,
        status, method, device_id, note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      data.teaching_schedule_id,
      data.teacher_id,
      data.check_in_at || null,
      data.check_out_at || null,
      data.status || 'on_time',
      data.method || null,
      data.device_id || null,
      data.note || null
    ]);
    return result.insertId;
  }

  async update(id, data, conn = pool) {
    const fields = [];
    const params = [];

    const allowed = ['check_in_at', 'check_out_at', 'status', 'method', 'device_id', 'note'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key] === '' ? null : data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE teacher_attendances SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM teacher_attendances WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async getSummaryStats({ date } = {}, conn = pool) {
    let sql = `
      SELECT 
        COUNT(CASE WHEN ta.status = 'on_time' THEN 1 END) AS on_time,
        COUNT(CASE WHEN ta.status = 'late' THEN 1 END) AS late,
        COUNT(CASE WHEN ta.status = 'absent' THEN 1 END) AS absent,
        COUNT(CASE WHEN ta.status = 'cancelled' THEN 1 END) AS cancelled,
        COUNT(CASE WHEN ta.status = 'substituted' THEN 1 END) AS substituted,
        COUNT(ta.id) AS total_recorded
      FROM teacher_attendances ta
      JOIN teaching_schedules ts ON ta.teaching_schedule_id = ts.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ' AND ts.date = ?';
      params.push(date);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0];
  }
}

module.exports = new TeacherAttendanceRepository();
