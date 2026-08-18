const createTeachingScheduleSchema = {
  body: {
    academic_year_id: { type: 'integer', required: true, min: 1 },
    teacher_id: { type: 'integer', required: true, min: 1 },
    subject_id: { type: 'integer', required: true, min: 1 },
    class_id: { type: 'integer', required: true, min: 1 },
    room_id: { type: 'integer', required: false, min: 1 },
    date: { type: 'date', required: true },
    start_time: { type: 'time', required: true },
    end_time: { type: 'time', required: true },
    attendance_open_before: { type: 'integer', required: false, min: 0 },
    attendance_close_after: { type: 'integer', required: false, min: 0 },
    status: { type: 'string', required: false, enum: ['scheduled', 'cancelled', 'completed'] },
    note: { type: 'string', required: false, maxLength: 500 }
  }
};

const updateTeachingScheduleSchema = {
  body: {
    academic_year_id: { type: 'integer', required: false, min: 1 },
    teacher_id: { type: 'integer', required: false, min: 1 },
    subject_id: { type: 'integer', required: false, min: 1 },
    class_id: { type: 'integer', required: false, min: 1 },
    room_id: { type: 'integer', required: false },
    date: { type: 'date', required: false },
    start_time: { type: 'time', required: false },
    end_time: { type: 'time', required: false },
    attendance_open_before: { type: 'integer', required: false, min: 0 },
    attendance_close_after: { type: 'integer', required: false, min: 0 },
    status: { type: 'string', required: false, enum: ['scheduled', 'cancelled', 'completed'] },
    note: { type: 'string', required: false, maxLength: 500 }
  }
};

module.exports = {
  createTeachingScheduleSchema,
  updateTeachingScheduleSchema
};
