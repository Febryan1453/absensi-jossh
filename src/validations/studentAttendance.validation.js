const studentCheckInSchema = {
  body: {
    student_id: { type: 'integer', required: false, min: 1 },
    nis: { type: 'string', required: false },
    method: { type: 'string', required: false, enum: ['qr', 'rfid', 'nfc', 'face', 'manual', 'system'] },
    device_id: { type: 'integer', required: false, min: 1 },
    note: { type: 'string', required: false, maxLength: 500 },
    latitude: { type: 'number', required: false },
    longitude: { type: 'number', required: false }
  }
};

const studentCheckOutSchema = {
  body: {
    student_id: { type: 'integer', required: false, min: 1 },
    nis: { type: 'string', required: false },
    method: { type: 'string', required: false, enum: ['qr', 'rfid', 'nfc', 'face', 'manual', 'system'] },
    device_id: { type: 'integer', required: false, min: 1 },
    note: { type: 'string', required: false, maxLength: 500 },
    latitude: { type: 'number', required: false },
    longitude: { type: 'number', required: false }
  }
};

const studentManualAttendanceSchema = {
  body: {
    student_id: { type: 'integer', required: true, min: 1 },
    date: { type: 'date', required: false },
    check_in_status: { type: 'string', required: true, enum: ['present', 'late', 'absent', 'excused', 'sick', 'permission'] },
    check_out_status: { type: 'string', required: false, enum: ['completed', 'not_checked_out', 'early_leave'] },
    school_session_id: { type: 'integer', required: false, min: 1 },
    note: { type: 'string', required: false, maxLength: 500 }
  }
};

module.exports = {
  studentCheckInSchema,
  studentCheckOutSchema,
  studentManualAttendanceSchema
};
