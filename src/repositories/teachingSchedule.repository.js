const { pool } = require('../config/database');

class TeachingScheduleRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT 
        ts.id, ts.academic_year_id, ts.teacher_id, ts.subject_id, ts.class_id, ts.room_id,
        ts.date, ts.start_time, ts.end_time, ts.attendance_open_before, ts.attendance_close_after,
        ts.status, ts.note, ts.created_at, ts.updated_at,
        ay.name AS academic_year_name,
        t.nip AS teacher_nip, u.name AS teacher_name, u.email AS teacher_email,
        sub.code AS subject_code, sub.name AS subject_name,
        c.code AS class_code, c.name AS class_name,
        r.code AS room_code, r.name AS room_name,
        ta.id AS attendance_id, ta.check_in_at, ta.check_out_at, ta.status AS attendance_status
      FROM teaching_schedules ts
      JOIN academic_years ay ON ts.academic_year_id = ay.id
      JOIN teachers t ON ts.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN subjects sub ON ts.subject_id = sub.id
      JOIN classes c ON ts.class_id = c.id
      LEFT JOIN rooms r ON ts.room_id = r.id
      LEFT JOIN teacher_attendances ta ON ts.id = ta.teaching_schedule_id
      WHERE ts.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findAll({ academic_year_id, teacher_id, class_id, subject_id, room_id, date, status, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT 
        ts.id, ts.academic_year_id, ts.teacher_id, ts.subject_id, ts.class_id, ts.room_id,
        ts.date, ts.start_time, ts.end_time, ts.attendance_open_before, ts.attendance_close_after,
        ts.status, ts.note, ts.created_at, ts.updated_at,
        ay.name AS academic_year_name,
        t.nip AS teacher_nip, u.name AS teacher_name,
        sub.code AS subject_code, sub.name AS subject_name,
        c.code AS class_code, c.name AS class_name,
        r.code AS room_code, r.name AS room_name,
        ta.id AS attendance_id, ta.check_in_at, ta.check_out_at, ta.status AS attendance_status
      FROM teaching_schedules ts
      JOIN academic_years ay ON ts.academic_year_id = ay.id
      JOIN teachers t ON ts.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN subjects sub ON ts.subject_id = sub.id
      JOIN classes c ON ts.class_id = c.id
      LEFT JOIN rooms r ON ts.room_id = r.id
      LEFT JOIN teacher_attendances ta ON ts.id = ta.teaching_schedule_id
      WHERE 1=1
    `;
    const params = [];

    if (academic_year_id) {
      sql += ' AND ts.academic_year_id = ?';
      params.push(academic_year_id);
    }
    if (teacher_id) {
      sql += ' AND ts.teacher_id = ?';
      params.push(teacher_id);
    }
    if (class_id) {
      sql += ' AND ts.class_id = ?';
      params.push(class_id);
    }
    if (subject_id) {
      sql += ' AND ts.subject_id = ?';
      params.push(subject_id);
    }
    if (room_id) {
      sql += ' AND ts.room_id = ?';
      params.push(room_id);
    }
    if (date) {
      sql += ' AND ts.date = ?';
      params.push(date);
    }
    if (status) {
      sql += ' AND ts.status = ?';
      params.push(status);
    }

    // LIMIT/OFFSET tidak boleh jadi placeholder pada prepared statement
    // MySQL 8 (mysql2 .execute) - nilainya di-coerce ke integer agar tetap aman.
    // Deterministic tie-breaker on the primary key: without it MySQL may repeat
    // or skip rows whose sort keys are equal when LIMIT/OFFSET spans pages.
    sql += ' ORDER BY ts.date DESC, ts.start_time ASC, ts.id ASC LIMIT ' + parseInt(limit, 10) + ' OFFSET ' + parseInt(offset, 10);

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ academic_year_id, teacher_id, class_id, subject_id, room_id, date, status } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM teaching_schedules ts WHERE 1=1';
    const params = [];

    if (academic_year_id) {
      sql += ' AND ts.academic_year_id = ?';
      params.push(academic_year_id);
    }
    if (teacher_id) {
      sql += ' AND ts.teacher_id = ?';
      params.push(teacher_id);
    }
    if (class_id) {
      sql += ' AND ts.class_id = ?';
      params.push(class_id);
    }
    if (subject_id) {
      sql += ' AND ts.subject_id = ?';
      params.push(subject_id);
    }
    if (room_id) {
      sql += ' AND ts.room_id = ?';
      params.push(room_id);
    }
    if (date) {
      sql += ' AND ts.date = ?';
      params.push(date);
    }
    if (status) {
      sql += ' AND ts.status = ?';
      params.push(status);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create(data, conn = pool) {
    const sql = `
      INSERT INTO teaching_schedules (
        academic_year_id, teacher_id, subject_id, class_id, room_id,
        date, start_time, end_time, attendance_open_before, attendance_close_after,
        status, note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      data.academic_year_id,
      data.teacher_id,
      data.subject_id,
      data.class_id,
      data.room_id || null,
      data.date,
      data.start_time,
      data.end_time,
      data.attendance_open_before || 30,
      data.attendance_close_after || 30,
      data.status || 'scheduled',
      data.note || null
    ]);
    return result.insertId;
  }

  async update(id, data, conn = pool) {
    const fields = [];
    const params = [];

    const allowed = [
      'academic_year_id', 'teacher_id', 'subject_id', 'class_id', 'room_id',
      'date', 'start_time', 'end_time', 'attendance_open_before', 'attendance_close_after',
      'status', 'note'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key] === '' ? null : data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE teaching_schedules SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM teaching_schedules WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async checkConflicts({ teacher_id, class_id, room_id, date, start_time, end_time, excludeId = null }, conn = pool) {
    let sql = `
      SELECT id, teacher_id, class_id, room_id, date, start_time, end_time
      FROM teaching_schedules
      WHERE date = ? AND status != 'cancelled'
        AND (start_time < ? AND end_time > ?)
        AND (teacher_id = ? OR class_id = ? OR (room_id IS NOT NULL AND room_id = ?))
    `;
    const params = [date, end_time, start_time, teacher_id, class_id, room_id || 0];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await conn.execute(sql, params);
    return rows;
  }
}

module.exports = new TeachingScheduleRepository();
