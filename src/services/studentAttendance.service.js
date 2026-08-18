const studentAttendanceRepository = require('../repositories/studentAttendance.repository');
const studentRepository = require('../repositories/student.repository');
const schoolSessionRepository = require('../repositories/schoolSession.repository');
const attendanceEventRepository = require('../repositories/attendanceEvent.repository');
const notificationRepository = require('../repositories/notification.repository');
const studentParentRepository = require('../repositories/studentParent.repository');
const { withTransaction } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/appError');
const { getCurrentDate, getCurrentTime, compareTimes } = require('../utils/date');

class StudentAttendanceService {
  /**
   * Get attendance records with RBAC and ownership filtering
   */
  async getAll(query, currentUser) {
    const { student_id, class_id, date, start_date, end_date, check_in_status, check_out_status, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    let targetStudentId = student_id;

    // Enforce role-based ownership
    if (currentUser.role === 'student') {
      const studentProfile = await studentRepository.findByUserId(currentUser.id);
      if (!studentProfile) throw new ForbiddenError('Student profile not found');
      targetStudentId = studentProfile.id;
    } else if (currentUser.role === 'parent') {
      const parentProfile = await studentParentRepository.findByParentId ? null : null; // fetch through student_parents
      // verify parent can view student
      if (targetStudentId) {
        const link = await studentParentRepository.findByStudentAndParent(targetStudentId, currentUser.id);
        if (!link || !link.can_view_attendance) {
          throw new ForbiddenError('You are not authorized to view attendance for this student');
        }
      }
    }

    const [items, total] = await Promise.all([
      studentAttendanceRepository.findAll({
        student_id: targetStudentId,
        class_id,
        date,
        start_date,
        end_date,
        check_in_status,
        check_out_status,
        search,
        limit,
        offset
      }),
      studentAttendanceRepository.countAll({
        student_id: targetStudentId,
        class_id,
        date,
        start_date,
        end_date,
        check_in_status,
        check_out_status,
        search
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

  async getById(id, currentUser) {
    const item = await studentAttendanceRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Attendance record with ID ${id} not found`);
    }

    // Role-based access validation
    if (currentUser.role === 'student') {
      const studentProfile = await studentRepository.findByUserId(currentUser.id);
      if (!studentProfile || studentProfile.id !== item.student_id) {
        throw new ForbiddenError('You cannot access another student attendance record');
      }
    }

    return item;
  }

  /**
   * Process student check-in within an atomic MySQL transaction
   */
  async checkIn(data, context = {}) {
    const { student_id, nis, method = 'qr', device_id, note, ip_address, user_agent, latitude, longitude } = data;

    // Resolve student record
    let student;
    if (student_id) {
      student = await studentRepository.findById(student_id);
    } else if (nis) {
      student = await studentRepository.findByNis(nis);
      if (student) student = await studentRepository.findById(student.id);
    }

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    if (student.status !== 'active') {
      throw new BadRequestError(`Cannot record attendance for student with status '${student.status}'`);
    }

    const todayDate = getCurrentDate();
    const currentTime = getCurrentTime();

    // Check for existing check-in today
    const existing = await studentAttendanceRepository.findByStudentAndDate(student.id, todayDate);
    if (existing && existing.check_in_at) {
      throw new ConflictError(`Student ${student.name} has already checked in today at ${existing.check_in_at}`);
    }

    // Determine status from active school session
    const session = await schoolSessionRepository.findActive();
    let checkInStatus = 'present';

    if (session) {
      if (compareTimes(currentTime, session.late_after) > 0) {
        checkInStatus = 'late';
      }
    }

    const attendanceId = await withTransaction(async (conn) => {
      let recordId;
      if (existing) {
        // Update existing record
        await studentAttendanceRepository.update(
          existing.id,
          {
            school_session_id: session ? session.id : null,
            check_in_at: new Date(),
            check_in_status: checkInStatus,
            check_in_method: method,
            check_in_device_id: device_id || null,
            note: note || null
          },
          conn
        );
        recordId = existing.id;
      } else {
        // Create new record
        recordId = await studentAttendanceRepository.create(
          {
            student_id: student.id,
            school_session_id: session ? session.id : null,
            date: todayDate,
            check_in_at: new Date(),
            check_in_status: checkInStatus,
            check_in_method: method,
            check_in_device_id: device_id || null,
            note: note || null
          },
          conn
        );
      }

      // Record audit event
      await attendanceEventRepository.create(
        {
          event_type: 'student_check_in',
          student_attendance_id: recordId,
          user_id: context.user ? context.user.id : student.user_id,
          device_id: device_id || null,
          occurred_at: new Date(),
          method,
          ip_address: ip_address || context.ip,
          user_agent: user_agent || context.userAgent,
          latitude,
          longitude,
          metadata: {
            check_in_status: checkInStatus,
            session_name: session ? session.name : null,
            student_name: student.name,
            class_name: student.class_name
          }
        },
        conn
      );

      // Dispatch parent notifications
      const parentLinks = await studentParentRepository.findParentsForNotification(student.id, conn);
      const notificationTitle = checkInStatus === 'late'
        ? `⚠️ Notifikasi Keterlambatan: ${student.name}`
        : `✅ Notifikasi Masuk Sekolah: ${student.name}`;
      
      const notificationMessage = checkInStatus === 'late'
        ? `Siswa ${student.name} (${student.nis}) tercatat MASUK TERLAMBAT pada pukul ${currentTime}.`
        : `Siswa ${student.name} (${student.nis}) telah MASUK sekolah pada pukul ${currentTime} dan hadir tepat waktu.`;

      for (const parent of parentLinks) {
        await notificationRepository.create(
          {
            student_attendance_id: recordId,
            parent_id: parent.parent_id,
            type: checkInStatus === 'late' ? 'late' : 'check_in',
            channel: 'web',
            status: 'sent',
            title: notificationTitle,
            message: notificationMessage,
            sent_at: new Date()
          },
          conn
        );
      }

      return recordId;
    });

    return studentAttendanceRepository.findById(attendanceId);
  }

  /**
   * Process student check-out within an atomic MySQL transaction
   */
  async checkOut(data, context = {}) {
    const { student_id, nis, method = 'qr', device_id, note, ip_address, user_agent, latitude, longitude } = data;

    let student;
    if (student_id) {
      student = await studentRepository.findById(student_id);
    } else if (nis) {
      student = await studentRepository.findByNis(nis);
      if (student) student = await studentRepository.findById(student.id);
    }

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const todayDate = getCurrentDate();
    const currentTime = getCurrentTime();

    const existing = await studentAttendanceRepository.findByStudentAndDate(student.id, todayDate);
    if (!existing) {
      throw new BadRequestError(`Cannot check out: No attendance record found for student ${student.name} today.`);
    }

    if (existing.check_out_at) {
      throw new ConflictError(`Student ${student.name} has already checked out today at ${existing.check_out_at}`);
    }

    const session = existing.school_session_id
      ? await schoolSessionRepository.findById(existing.school_session_id)
      : await schoolSessionRepository.findActive();

    let checkOutStatus = 'completed';

    if (session && session.check_out_start) {
      if (compareTimes(currentTime, session.check_out_start) < 0) {
        checkOutStatus = 'early_leave';
      }
    }

    await withTransaction(async (conn) => {
      await studentAttendanceRepository.update(
        existing.id,
        {
          check_out_at: new Date(),
          check_out_status: checkOutStatus,
          check_out_method: method,
          check_out_device_id: device_id || null,
          note: note !== undefined ? note : existing.note
        },
        conn
      );

      // Record audit event
      await attendanceEventRepository.create(
        {
          event_type: 'student_check_out',
          student_attendance_id: existing.id,
          user_id: context.user ? context.user.id : student.user_id,
          device_id: device_id || null,
          occurred_at: new Date(),
          method,
          ip_address: ip_address || context.ip,
          user_agent: user_agent || context.userAgent,
          latitude,
          longitude,
          metadata: {
            check_out_status: checkOutStatus,
            student_name: student.name,
            class_name: student.class_name
          }
        },
        conn
      );

      // Dispatch parent notifications
      const parentLinks = await studentParentRepository.findParentsForNotification(student.id, conn);
      const notificationTitle = checkOutStatus === 'early_leave'
        ? `⚠️ Notifikasi Pulang Cepat: ${student.name}`
        : `👋 Notifikasi Pulang Sekolah: ${student.name}`;

      const notificationMessage = checkOutStatus === 'early_leave'
        ? `Siswa ${student.name} (${student.nis}) tercatat PULANG LEBIH AWAL pada pukul ${currentTime}.`
        : `Siswa ${student.name} (${student.nis}) telah PULANG sekolah pada pukul ${currentTime}.`;

      for (const parent of parentLinks) {
        await notificationRepository.create(
          {
            student_attendance_id: existing.id,
            parent_id: parent.parent_id,
            type: checkOutStatus === 'early_leave' ? 'early_leave' : 'check_out',
            channel: 'web',
            status: 'sent',
            title: notificationTitle,
            message: notificationMessage,
            sent_at: new Date()
          },
          conn
        );
      }
    });

    return studentAttendanceRepository.findById(existing.id);
  }

  /**
   * Manual attendance recording / adjustment by Admin or Teacher
   */
  async recordManual(data, context = {}) {
    const {
      student_id, date = getCurrentDate(), check_in_status, check_out_status,
      note, school_session_id
    } = data;

    const student = await studentRepository.findById(student_id);
    if (!student) {
      throw new NotFoundError(`Student with ID ${student_id} not found`);
    }

    const existing = await studentAttendanceRepository.findByStudentAndDate(student_id, date);

    const attendanceId = await withTransaction(async (conn) => {
      let recordId;
      if (existing) {
        await studentAttendanceRepository.update(
          existing.id,
          {
            school_session_id: school_session_id || existing.school_session_id,
            check_in_status: check_in_status || existing.check_in_status,
            check_out_status: check_out_status || existing.check_out_status,
            check_in_method: 'manual',
            note: note || existing.note
          },
          conn
        );
        recordId = existing.id;
      } else {
        recordId = await studentAttendanceRepository.create(
          {
            student_id,
            school_session_id: school_session_id || null,
            date,
            check_in_at: ['present', 'late'].includes(check_in_status) ? new Date() : null,
            check_in_status,
            check_out_status: check_out_status || null,
            check_in_method: 'manual',
            note: note || null
          },
          conn
        );
      }

      // Record audit event
      await attendanceEventRepository.create(
        {
          event_type: existing ? 'manual_correction' : 'attendance_created',
          student_attendance_id: recordId,
          user_id: context.user ? context.user.id : null,
          occurred_at: new Date(),
          method: 'manual',
          ip_address: context.ip,
          user_agent: context.userAgent,
          metadata: {
            action: 'manual_attendance',
            check_in_status,
            note
          }
        },
        conn
      );

      // Notify parent if excused/sick/permission/absent
      if (['absent', 'sick', 'permission', 'excused'].includes(check_in_status)) {
        const parentLinks = await studentParentRepository.findParentsForNotification(student.id, conn);
        for (const parent of parentLinks) {
          await notificationRepository.create(
            {
              student_attendance_id: recordId,
              parent_id: parent.parent_id,
              type: check_in_status === 'excused' ? 'permission' : check_in_status,
              channel: 'web',
              status: 'sent',
              title: `Status Kehadiran Siswa: ${student.name} (${check_in_status.toUpperCase()})`,
              message: `Siswa ${student.name} pada tanggal ${date} berstatus ${check_in_status.toUpperCase()}. Keterangan: ${note || '-'}.`,
              sent_at: new Date()
            },
            conn
          );
        }
      }

      return recordId;
    });

    return studentAttendanceRepository.findById(attendanceId);
  }

  async getTodaySummary(query) {
    const date = query.date || getCurrentDate();
    const classId = query.class_id || null;
    return studentAttendanceRepository.getSummaryStats({ date, class_id: classId });
  }
}

module.exports = new StudentAttendanceService();
