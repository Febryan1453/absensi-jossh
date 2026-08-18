const createTeacherSchema = {
  body: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 150 },
    email: { type: 'email', required: false, maxLength: 150 },
    password: { type: 'string', required: false, minLength: 6 },
    nip: { type: 'string', required: false, maxLength: 50 },
    phone: { type: 'string', required: false, maxLength: 30 },
    gender: { type: 'string', required: false, enum: ['male', 'female'] },
    birth_date: { type: 'date', required: false },
    address: { type: 'string', required: false },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

const updateTeacherSchema = {
  body: {
    name: { type: 'string', required: false, minLength: 2, maxLength: 150 },
    email: { type: 'email', required: false, maxLength: 150 },
    nip: { type: 'string', required: false, maxLength: 50 },
    phone: { type: 'string', required: false, maxLength: 30 },
    gender: { type: 'string', required: false, enum: ['male', 'female'] },
    birth_date: { type: 'date', required: false },
    address: { type: 'string', required: false },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

module.exports = {
  createTeacherSchema,
  updateTeacherSchema
};
