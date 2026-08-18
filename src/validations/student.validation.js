const createStudentSchema = {
  body: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 150 },
    class_id: { type: 'integer', required: true, min: 1 },
    nis: { type: 'string', required: true, minLength: 1, maxLength: 50 },
    nisn: { type: 'string', required: false, maxLength: 50 },
    email: { type: 'email', required: false, maxLength: 150 },
    password: { type: 'string', required: false, minLength: 6 },
    gender: { type: 'string', required: false, enum: ['male', 'female'] },
    birth_place: { type: 'string', required: false, maxLength: 100 },
    birth_date: { type: 'date', required: false },
    phone: { type: 'string', required: false, maxLength: 30 },
    address: { type: 'string', required: false },
    photo: { type: 'string', required: false, maxLength: 255 },
    admission_date: { type: 'date', required: false },
    graduation_date: { type: 'date', required: false },
    status: { type: 'string', required: false, enum: ['active', 'inactive', 'graduated', 'transferred'] }
  }
};

const updateStudentSchema = {
  body: {
    name: { type: 'string', required: false, minLength: 2, maxLength: 150 },
    class_id: { type: 'integer', required: false, min: 1 },
    nis: { type: 'string', required: false, minLength: 1, maxLength: 50 },
    nisn: { type: 'string', required: false, maxLength: 50 },
    email: { type: 'email', required: false, maxLength: 150 },
    gender: { type: 'string', required: false, enum: ['male', 'female'] },
    birth_place: { type: 'string', required: false, maxLength: 100 },
    birth_date: { type: 'date', required: false },
    phone: { type: 'string', required: false, maxLength: 30 },
    address: { type: 'string', required: false },
    photo: { type: 'string', required: false, maxLength: 255 },
    admission_date: { type: 'date', required: false },
    graduation_date: { type: 'date', required: false },
    status: { type: 'string', required: false, enum: ['active', 'inactive', 'graduated', 'transferred'] }
  }
};

module.exports = {
  createStudentSchema,
  updateStudentSchema
};
