const { pool } = require('../config/database');

class StudentAttendanceRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT 
        sa.id, sa.student_id, sa.school_session_id, sa.date, sa.check_in_at, sa.check_out_at,
        sa.check_in_status, sa.check_out_status, sa.check_in_method, sa.check_out_method,
        sa.check_in_device_id, sa.check_out_device_id, sa.note, sa.created_at, sa.updated_at,
        s.nis, s.nisn, u.name AS student_name, u.email AS student_email,
        c.id AS class_id, c.code AS class_code, c.name AS class_name,
        ss.name AS session_name,
        d1.name AS check_in_device_name,
        d2.name AS check_out_device_name
      FROM student_attendances sa
      JOIN students s ON sa.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN school_sessions ss ON sa.school_session_id = ss.id
      LEFT JOIN attendance_devices d1 ON sa.check_in_device_id = d1.id
      LEFT JOIN attendance_devices d2 ON sa.check_out_device_id = d2.id
      WHERE sa.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findByStudentAndDate(studentId, date, conn = pool) {
    const sql = `
      SELECT 
        sa.id, sa.student_id, sa.school_session_id, sa.date, sa.check_in_at, sa.check_out_at,
        sa.check_in_status, sa.check_out_status, sa.check_in_method, sa.check_out_method,
        sa.check_in_device_id, sa.check_out_device_id, sa.note, sa.created_at, sa.updated_at,
        s.nis, s.nisn, u.name AS student_name,
        c.id AS class_id, c.code AS class_code, c.name AS class_name
      FROM student_attendances sa
      JOIN students s ON sa.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE sa.student_id = ? AND sa.date = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [studentId, date]);
    return rows[0] || null;
  }

  async findAll({ student_id, class_id, date, start_date, end_date, check_in_status, check_out_status, search, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT 
        sa.id, sa.student_id, sa.school_session_id, sa.date, sa.check_in_at, sa.check_out_at,
        sa.check_in_status, sa.check_out_status, sa.check_in_method, sa.check_out_method,
        sa.check_in_device_id, sa.check_out_device_id, sa.note, sa.created_at, sa.updated_at,
        s.nis, s.nisn, u.name AS student_name,
        c.id AS class_id, c.code AS class_code, c.name AS class_name,
        ss.name AS session_name
      FROM student_attendances sa
      JOIN students s ON sa.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN school_sessions ss ON sa.school_session_id = ss.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      sql += ' AND sa.student_id = ?';
      params.push(student_id);
    }
    if (class_id) {
      sql += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (date) {
      sql += ' AND sa.date = ?';
      params.push(date);
    }
    if (start_date && end_date) {
      sql += ' AND sa.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    if (check_in_status) {
      sql += ' AND sa.check_in_status = ?';
      params.push(check_in_status);
    }
    if (check_out_status) {
      sql += ' AND sa.check_out_status = ?';
      params.push(check_out_status);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR s.nis LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY sa.date DESC, sa.check_in_at DESC, u.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ student_id, class_id, date, start_date, end_date, check_in_status, check_out_status, search } = {}, conn = pool) {
    let sql = `
      SELECT COUNT(*) as total
      FROM student_attendances sa
      JOIN students s ON sa.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      sql += ' AND sa.student_id = ?';
      params.push(student_id);
    }
    if (class_id) {
      sql += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (date) {
      sql += ' AND sa.date = ?';
      params.push(date);
    }
    if (start_date && end_date) {
      sql += ' AND sa.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    if (check_in_status) {
      sql += ' AND sa.check_in_status = ?';
      params.push(check_in_status);
    }
    if (check_out_status) {
      sql += ' AND sa.check_out_status = ?';
      params.push(check_out_status);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR s.nis LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create(data, conn = pool) {
    const sql = `
      INSERT INTO student_attendances (
        student_id, school_session_id, date, check_in_at, check_out_at,
        check_in_status, check_out_status, check_in_method, check_out_method,
        check_in_device_id, check_out_device_id, note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      data.student_id,
      data.school_session_id || null,
      data.date,
      data.check_in_at || null,
      data.check_out_at || null,
      data.check_in_status || null,
      data.check_out_status || null,
      data.check_in_method || null,
      data.check_out_method || null,
      data.check_in_device_id || null,
      data.check_out_device_id || null,
      data.note || null
    ]);
    return result.insertId;
  }

  async update(id, data, conn = pool) {
    const fields = [];
    const params = [];

    const allowed = [
      'school_session_id', 'date', 'check_in_at', 'check_out_at',
      'check_in_status', 'check_out_status', 'check_in_method', 'check_out_method',
      'check_in_device_id', 'check_out_device_id', 'note'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key] === '' ? null : data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE student_attendances SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await conn.execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, conn = pool) {
    const sql = 'DELETE FROM student_attendances WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async getSummaryStats({ date, class_id } = {}, conn = pool) {
    let sql = `
      SELECT 
        COUNT(CASE WHEN sa.check_in_status = 'present' THEN 1 END) AS present,
        COUNT(CASE WHEN sa.check_in_status = 'late' THEN 1 END) AS late,
        COUNT(CASE WHEN sa.check_in_status = 'absent' THEN 1 END) AS absent,
        COUNT(CASE WHEN sa.check_in_status = 'sick' THEN 1 END) AS sick,
        COUNT(CASE WHEN sa.check_in_status = 'permission' THEN 1 END) AS permission,
        COUNT(CASE WHEN sa.check_in_status = 'excused' THEN 1 END) AS excused,
        COUNT(CASE WHEN sa.check_out_status = 'completed' THEN 1 END) AS checked_out,
        COUNT(CASE WHEN sa.check_out_status = 'early_leave' THEN 1 END) AS early_leave,
        COUNT(sa.id) AS total_recorded
      FROM student_attendances sa
      JOIN students s ON sa.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ' AND sa.date = ?';
      params.push(date);
    }
    if (class_id) {
      sql += ' AND s.class_id = ?';
      params.push(class_id);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0];
  }
}

module.exports = new StudentAttendanceRepository();
