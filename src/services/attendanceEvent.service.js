const attendanceEventRepository = require('../repositories/attendanceEvent.repository');
const { NotFoundError } = require('../utils/appError');

class AttendanceEventService {
  async getAll(query) {
    const {
      event_type, student_attendance_id, teacher_attendance_id,
      user_id, device_id, method, start_date, end_date,
      page = 1, limit = 20
    } = query;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      attendanceEventRepository.findAll({
        event_type,
        student_attendance_id,
        teacher_attendance_id,
        user_id,
        device_id,
        method,
        start_date,
        end_date,
        limit,
        offset
      }),
      attendanceEventRepository.countAll({
        event_type,
        student_attendance_id,
        teacher_attendance_id,
        user_id,
        device_id,
        method,
        start_date,
        end_date
      })
    ]);

    return {
      items,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const item = await attendanceEventRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Attendance audit event with ID ${id} not found`);
    }
    return item;
  }
}

module.exports = new AttendanceEventService();
