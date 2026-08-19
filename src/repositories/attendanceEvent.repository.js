const { pool } = require('../config/database');

class AttendanceEventRepository {
  async findById(id, conn = pool) {
    const sql = `
      SELECT 
        ae.id, ae.event_type, ae.student_attendance_id, ae.teacher_attendance_id,
        ae.user_id, ae.device_id, ae.occurred_at, ae.method, ae.ip_address,
        ae.user_agent, ae.latitude, ae.longitude, ae.metadata, ae.created_at,
        u.name AS user_name, u.email AS user_email,
        d.name AS device_name, d.code AS device_code
      FROM attendance_events ae
      LEFT JOIN users u ON ae.user_id = u.id
      LEFT JOIN attendance_devices d ON ae.device_id = d.id
      WHERE ae.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(sql, [id]);
    return rows[0] || null;
  }

  async findAll({ event_type, student_attendance_id, teacher_attendance_id, user_id, device_id, method, start_date, end_date, limit = 50, offset = 0 } = {}, conn = pool) {
    let sql = `
      SELECT 
        ae.id, ae.event_type, ae.student_attendance_id, ae.teacher_attendance_id,
        ae.user_id, ae.device_id, ae.occurred_at, ae.method, ae.ip_address,
        ae.user_agent, ae.latitude, ae.longitude, ae.metadata, ae.created_at,
        u.name AS user_name,
        d.name AS device_name
      FROM attendance_events ae
      LEFT JOIN users u ON ae.user_id = u.id
      LEFT JOIN attendance_devices d ON ae.device_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (event_type) {
      sql += ' AND ae.event_type = ?';
      params.push(event_type);
    }
    if (student_attendance_id) {
      sql += ' AND ae.student_attendance_id = ?';
      params.push(student_attendance_id);
    }
    if (teacher_attendance_id) {
      sql += ' AND ae.teacher_attendance_id = ?';
      params.push(teacher_attendance_id);
    }
    if (user_id) {
      sql += ' AND ae.user_id = ?';
      params.push(user_id);
    }
    if (device_id) {
      sql += ' AND ae.device_id = ?';
      params.push(device_id);
    }
    if (method) {
      sql += ' AND ae.method = ?';
      params.push(method);
    }
    if (start_date && end_date) {
      sql += ' AND DATE(ae.occurred_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // LIMIT/OFFSET tidak boleh jadi placeholder pada prepared statement
    // MySQL 8 (mysql2 .execute) - nilainya di-coerce ke integer agar tetap aman.
    // Deterministic tie-breaker on the primary key: without it MySQL may repeat
    // or skip rows whose sort keys are equal when LIMIT/OFFSET spans pages.
    sql += ' ORDER BY ae.occurred_at DESC, ae.id ASC LIMIT ' + parseInt(limit, 10) + ' OFFSET ' + parseInt(offset, 10);

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async countAll({ event_type, student_attendance_id, teacher_attendance_id, user_id, device_id, method, start_date, end_date } = {}, conn = pool) {
    let sql = 'SELECT COUNT(*) as total FROM attendance_events ae WHERE 1=1';
    const params = [];

    if (event_type) {
      sql += ' AND ae.event_type = ?';
      params.push(event_type);
    }
    if (student_attendance_id) {
      sql += ' AND ae.student_attendance_id = ?';
      params.push(student_attendance_id);
    }
    if (teacher_attendance_id) {
      sql += ' AND ae.teacher_attendance_id = ?';
      params.push(teacher_attendance_id);
    }
    if (user_id) {
      sql += ' AND ae.user_id = ?';
      params.push(user_id);
    }
    if (device_id) {
      sql += ' AND ae.device_id = ?';
      params.push(device_id);
    }
    if (method) {
      sql += ' AND ae.method = ?';
      params.push(method);
    }
    if (start_date && end_date) {
      sql += ' AND DATE(ae.occurred_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const [rows] = await conn.execute(sql, params);
    return rows[0].total;
  }

  async create(data, conn = pool) {
    const sql = `
      INSERT INTO attendance_events (
        event_type, student_attendance_id, teacher_attendance_id, user_id, device_id,
        occurred_at, method, ip_address, user_agent, latitude, longitude, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
      data.event_type,
      data.student_attendance_id || null,
      data.teacher_attendance_id || null,
      data.user_id || null,
      data.device_id || null,
      data.occurred_at || new Date(),
      data.method,
      data.ip_address || null,
      data.user_agent || null,
      data.latitude !== undefined ? data.latitude : null,
      data.longitude !== undefined ? data.longitude : null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ]);
    return result.insertId;
  }
}

module.exports = new AttendanceEventRepository();
