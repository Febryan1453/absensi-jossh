const teacherCheckInSchema = {
  body: {
    teaching_schedule_id: { type: 'integer', required: true, min: 1 },
    method: { type: 'string', required: false, enum: ['qr', 'rfid', 'nfc', 'face', 'manual', 'system'] },
    device_id: { type: 'integer', required: false, min: 1 },
    note: { type: 'string', required: false, maxLength: 500 },
    latitude: { type: 'number', required: false },
    longitude: { type: 'number', required: false }
  }
};

const teacherCheckOutSchema = {
  body: {
    teaching_schedule_id: { type: 'integer', required: true, min: 1 },
    method: { type: 'string', required: false, enum: ['qr', 'rfid', 'nfc', 'face', 'manual', 'system'] },
    device_id: { type: 'integer', required: false, min: 1 },
    note: { type: 'string', required: false, maxLength: 500 },
    latitude: { type: 'number', required: false },
    longitude: { type: 'number', required: false }
  }
};

const teacherManualAttendanceSchema = {
  body: {
    teaching_schedule_id: { type: 'integer', required: true, min: 1 },
    teacher_id: { type: 'integer', required: false, min: 1 },
    status: { type: 'string', required: true, enum: ['on_time', 'late', 'absent', 'cancelled', 'substituted'] },
    note: { type: 'string', required: false, maxLength: 500 }
  }
};

module.exports = {
  teacherCheckInSchema,
  teacherCheckOutSchema,
  teacherManualAttendanceSchema
};
