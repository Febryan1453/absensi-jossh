const teachingScheduleRepository = require('../repositories/teachingSchedule.repository');
const academicYearRepository = require('../repositories/academicYear.repository');
const teacherRepository = require('../repositories/teacher.repository');
const subjectRepository = require('../repositories/subject.repository');
const classRepository = require('../repositories/class.repository');
const roomRepository = require('../repositories/room.repository');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/appError');
const { compareTimes } = require('../utils/date');

class TeachingScheduleService {
  async getAll(query) {
    const { academic_year_id, teacher_id, class_id, subject_id, room_id, date, status, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      teachingScheduleRepository.findAll({
        academic_year_id,
        teacher_id,
        class_id,
        subject_id,
        room_id,
        date,
        status,
        limit,
        offset
      }),
      teachingScheduleRepository.countAll({
        academic_year_id,
        teacher_id,
        class_id,
        subject_id,
        room_id,
        date,
        status
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
    const item = await teachingScheduleRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Teaching schedule with ID ${id} not found`);
    }
    return item;
  }

  async create(data) {
    const { academic_year_id, teacher_id, subject_id, class_id, room_id, date, start_time, end_time } = data;

    // Verify foreign records exist
    const [ay, teacher, subject, classRec] = await Promise.all([
      academicYearRepository.findById(academic_year_id),
      teacherRepository.findById(teacher_id),
      subjectRepository.findById(subject_id),
      classRepository.findById(class_id)
    ]);

    if (!ay) throw new NotFoundError(`Academic year with ID ${academic_year_id} not found`);
    if (!teacher) throw new NotFoundError(`Teacher with ID ${teacher_id} not found`);
    if (!subject) throw new NotFoundError(`Subject with ID ${subject_id} not found`);
    if (!classRec) throw new NotFoundError(`Class with ID ${class_id} not found`);

    if (room_id) {
      const room = await roomRepository.findById(room_id);
      if (!room) throw new NotFoundError(`Room with ID ${room_id} not found`);
    }

    if (compareTimes(start_time, end_time) >= 0) {
      throw new BadRequestError('start_time must be earlier than end_time');
    }

    // Check for scheduling conflicts (same teacher, class, or room at overlapping time on same date)
    const conflicts = await teachingScheduleRepository.checkConflicts({
      teacher_id,
      class_id,
      room_id,
      date,
      start_time,
      end_time
    });

    if (conflicts.length > 0) {
      throw new ConflictError(
        'Schedule conflict detected: The teacher, class, or room is already booked for an overlapping time on this date.'
      );
    }

    const id = await teachingScheduleRepository.create(data);
    return this.getById(id);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    const teacherId = data.teacher_id || existing.teacher_id;
    const classId = data.class_id || existing.class_id;
    const roomId = data.room_id !== undefined ? data.room_id : existing.room_id;
    const date = data.date || existing.date;
    const startTime = data.start_time || existing.start_time;
    const endTime = data.end_time || existing.end_time;

    if (compareTimes(startTime, endTime) >= 0) {
      throw new BadRequestError('start_time must be earlier than end_time');
    }

    // Check conflict if timing/assignment changed
    if (data.teacher_id || data.class_id || data.room_id || data.date || data.start_time || data.end_time) {
      const conflicts = await teachingScheduleRepository.checkConflicts({
        teacher_id: teacherId,
        class_id: classId,
        room_id: roomId,
        date,
        start_time: startTime,
        end_time: endTime,
        excludeId: id
      });

      if (conflicts.length > 0) {
        throw new ConflictError('Schedule conflict detected for the updated time or assignments.');
      }
    }

    await teachingScheduleRepository.update(id, data);
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await teachingScheduleRepository.delete(id);
    return true;
  }
}

module.exports = new TeachingScheduleService();
