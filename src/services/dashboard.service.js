const { pool } = require('../config/database');
const studentAttendanceRepository = require('../repositories/studentAttendance.repository');
const teacherAttendanceRepository = require('../repositories/teacherAttendance.repository');
const attendanceEventRepository = require('../repositories/attendanceEvent.repository');
const { getCurrentDate } = require('../utils/date');

class DashboardService {
  async getSummary(query = {}) {
    const today = query.date || getCurrentDate();

    const [userCounts, studentSummary, teacherSummary, classCount, studentCount, teacherCount, deviceCount, recentEvents] = await Promise.all([
      // Users by role
      pool.execute(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role
      `).then(([rows]) => rows),

      // Today's student attendance stats
      studentAttendanceRepository.getSummaryStats({ date: today }),

      // Today's teacher attendance stats
      teacherAttendanceRepository.getSummaryStats({ date: today }),

      // Total active classes
      pool.execute("SELECT COUNT(*) as count FROM classes WHERE status = 'active'").then(([rows]) => rows[0].count),

      // Total active students
      pool.execute("SELECT COUNT(*) as count FROM students WHERE status = 'active'").then(([rows]) => rows[0].count),

      // Total active teachers
      pool.execute("SELECT COUNT(*) as count FROM teachers WHERE status = 'active'").then(([rows]) => rows[0].count),

      // Total devices
      pool.execute('SELECT COUNT(*) as count FROM attendance_devices').then(([rows]) => rows[0].count),

      // Recent attendance activity logs
      attendanceEventRepository.findAll({ limit: 10, offset: 0 })
    ]);

    const usersByRole = userCounts.reduce((acc, row) => {
      acc[row.role] = parseInt(row.count, 10);
      return acc;
    }, { admin: 0, teacher: 0, student: 0, parent: 0 });

    return {
      date: today,
      counts: {
        total_users: Object.values(usersByRole).reduce((a, b) => a + b, 0),
        users_by_role: usersByRole,
        active_classes: classCount,
        active_students: studentCount,
        active_teachers: teacherCount,
        devices: deviceCount
      },
      student_attendance_today: studentSummary,
      teacher_attendance_today: teacherSummary,
      recent_activity: recentEvents
    };
  }
}

module.exports = new DashboardService();
