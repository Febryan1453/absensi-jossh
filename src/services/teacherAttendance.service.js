const teacherAttendanceRepository = require('../repositories/teacherAttendance.repository');
const teachingScheduleRepository = require('../repositories/teachingSchedule.repository');
const teacherRepository = require('../repositories/teacher.repository');
const attendanceEventRepository = require('../repositories/attendanceEvent.repository');
const { withTransaction } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/appError');
const { getCurrentDate, getCurrentTime, compareTimes } = require('../utils/date');

class TeacherAttendanceService {
  async getAll(query, currentUser) {
    const { teacher_id, date, status, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    let targetTeacherId = teacher_id;
    if (currentUser.role === 'teacher') {
      const teacherProfile = await teacherRepository.findByUserId(currentUser.id);
      if (!teacherProfile) throw new ForbiddenError('Teacher profile not found');
      targetTeacherId = teacherProfile.id;
    }

    const [items, total] = await Promise.all([
      teacherAttendanceRepository.findAll({ teacher_id: targetTeacherId, date, status, search, limit, offset }),
      teacherAttendanceRepository.countAll({ teacher_id: targetTeacherId, date, status, search })
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

  async getById(id, currentUser) {
    const item = await teacherAttendanceRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Teacher attendance record with ID ${id} not found`);
    }

    if (currentUser.role === 'teacher') {
      const teacherProfile = await teacherRepository.findByUserId(currentUser.id);
      if (!teacherProfile || teacherProfile.id !== item.teacher_id) {
        throw new ForbiddenError('You cannot access another teacher attendance record');
      }
    }

    return item;
  }

  /**
   * Teacher check-in for a specific teaching schedule
   */
  async checkIn(data, context = {}) {
    const { teaching_schedule_id, method = 'qr', device_id, note, ip_address, user_agent, latitude, longitude } = data;

    const schedule = await teachingScheduleRepository.findById(teaching_schedule_id);
    if (!schedule) {
      throw new NotFoundError(`Teaching schedule with ID ${teaching_schedule_id} not found`);
    }

    if (schedule.status === 'cancelled') {
      throw new BadRequestError('Cannot check in for a cancelled teaching schedule');
    }

    // Role verification
    if (context.user && context.user.role === 'teacher') {
      const teacherProfile = await teacherRepository.findByUserId(context.user.id);
      if (!teacherProfile || teacherProfile.id !== schedule.teacher_id) {
        throw new ForbiddenError('This teaching schedule is assigned to a different teacher');
      }
    }

    const currentTime = getCurrentTime();

    // Check if attendance already recorded
    const existing = await teacherAttendanceRepository.findByScheduleId(teaching_schedule_id);
    if (existing && existing.check_in_at) {
      throw new ConflictError(`Attendance already recorded for this schedule at ${existing.check_in_at}`);
    }

    // Calculate status (on_time vs late)
    let status = 'on_time';
    if (compareTimes(currentTime, schedule.start_time) > 0) {
      status = 'late';
    }

    const attendanceId = await withTransaction(async (conn) => {
      let recordId;
      if (existing) {
        await teacherAttendanceRepository.update(
          existing.id,
          {
            check_in_at: new Date(),
            status,
            method,
            device_id: device_id || null,
            note: note || null
          },
          conn
        );
        recordId = existing.id;
      } else {
        recordId = await teacherAttendanceRepository.create(
          {
            teaching_schedule_id,
            teacher_id: schedule.teacher_id,
            check_in_at: new Date(),
            status,
            method,
            device_id: device_id || null,
            note: note || null
          },
          conn
        );
      }

      // Record audit event
      await attendanceEventRepository.create(
        {
          event_type: 'teacher_check_in',
          teacher_attendance_id: recordId,
          user_id: context.user ? context.user.id : null,
          device_id: device_id || null,
          occurred_at: new Date(),
          method,
          ip_address: ip_address || context.ip,
          user_agent: user_agent || context.userAgent,
          latitude,
          longitude,
          metadata: {
            status,
            teaching_schedule_id,
            subject_name: schedule.subject_name,
            class_name: schedule.class_name
          }
        },
        conn
      );

      return recordId;
    });

    return teacherAttendanceRepository.findById(attendanceId);
  }

  /**
   * Teacher check-out for a teaching schedule
   */
  async checkOut(data, context = {}) {
    const { teaching_schedule_id, method = 'qr', device_id, note, ip_address, user_agent, latitude, longitude } = data;

    const existing = await teacherAttendanceRepository.findByScheduleId(teaching_schedule_id);
    if (!existing) {
      throw new BadRequestError('No check-in record found for this teaching schedule');
    }

    if (existing.check_out_at) {
      throw new ConflictError(`Check-out already completed at ${existing.check_out_at}`);
    }

    await withTransaction(async (conn) => {
      await teacherAttendanceRepository.update(
        existing.id,
        {
          check_out_at: new Date(),
          note: note !== undefined ? note : existing.note
        },
        conn
      );

      // Update schedule status to completed
      await teachingScheduleRepository.update(teaching_schedule_id, { status: 'completed' }, conn);

      // Record audit event
      await attendanceEventRepository.create(
        {
          event_type: 'teacher_check_out',
          teacher_attendance_id: existing.id,
          user_id: context.user ? context.user.id : null,
          device_id: device_id || null,
          occurred_at: new Date(),
          method,
          ip_address: ip_address || context.ip,
          user_agent: user_agent || context.userAgent,
          latitude,
          longitude,
          metadata: {
            action: 'teacher_check_out',
            teaching_schedule_id
          }
        },
        conn
      );
    });

    return teacherAttendanceRepository.findById(existing.id);
  }

  /**
   * Manual adjustment by Admin
   */
  async recordManual(data, context = {}) {
    const { teaching_schedule_id, teacher_id, status = 'on_time', method = 'manual', note } = data;

    const schedule = await teachingScheduleRepository.findById(teaching_schedule_id);
    if (!schedule) {
      throw new NotFoundError(`Teaching schedule with ID ${teaching_schedule_id} not found`);
    }

    const existing = await teacherAttendanceRepository.findByScheduleId(teaching_schedule_id);

    const attendanceId = await withTransaction(async (conn) => {
      let recordId;
      if (existing) {
        await teacherAttendanceRepository.update(
          existing.id,
          {
            teacher_id: teacher_id || existing.teacher_id,
            status,
            method: 'manual',
            note: note || existing.note
          },
          conn
        );
        recordId = existing.id;
      } else {
        recordId = await teacherAttendanceRepository.create(
          {
            teaching_schedule_id,
            teacher_id: teacher_id || schedule.teacher_id,
            check_in_at: ['on_time', 'late'].includes(status) ? new Date() : null,
            status,
            method: 'manual',
            note: note || null
          },
          conn
        );
      }

      await attendanceEventRepository.create(
        {
          event_type: existing ? 'manual_correction' : 'attendance_created',
          teacher_attendance_id: recordId,
          user_id: context.user ? context.user.id : null,
          occurred_at: new Date(),
          method: 'manual',
          ip_address: context.ip,
          user_agent: context.userAgent,
          metadata: {
            action: 'manual_teacher_attendance',
            status,
            note
          }
        },
        conn
      );

      return recordId;
    });

    return teacherAttendanceRepository.findById(attendanceId);
  }

  async getTodaySummary(query) {
    const date = query.date || getCurrentDate();
    return teacherAttendanceRepository.getSummaryStats({ date });
  }
}

module.exports = new TeacherAttendanceService();
