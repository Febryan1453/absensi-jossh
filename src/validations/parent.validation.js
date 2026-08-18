const createParentSchema = {
  body: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 150 },
    email: { type: 'email', required: false, maxLength: 150 },
    password: { type: 'string', required: false, minLength: 6 },
    nik: { type: 'string', required: false, maxLength: 30 },
    phone: { type: 'string', required: false, maxLength: 30 },
    gender: { type: 'string', required: false, enum: ['male', 'female'] },
    address: { type: 'string', required: false },
    occupation: { type: 'string', required: false, maxLength: 100 },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

const updateParentSchema = {
  body: {
    name: { type: 'string', required: false, minLength: 2, maxLength: 150 },
    email: { type: 'email', required: false, maxLength: 150 },
    nik: { type: 'string', required: false, maxLength: 30 },
    phone: { type: 'string', required: false, maxLength: 30 },
    gender: { type: 'string', required: false, enum: ['male', 'female'] },
    address: { type: 'string', required: false },
    occupation: { type: 'string', required: false, maxLength: 100 },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

const linkStudentSchema = {
  body: {
    student_id: { type: 'integer', required: true, min: 1 },
    relationship: { type: 'string', required: true, enum: ['father', 'mother', 'guardian', 'other'] },
    is_primary: { type: 'boolean', required: false },
    can_view_attendance: { type: 'boolean', required: false },
    can_receive_notification: { type: 'boolean', required: false }
  }
};

module.exports = {
  createParentSchema,
  updateParentSchema,
  linkStudentSchema
};
