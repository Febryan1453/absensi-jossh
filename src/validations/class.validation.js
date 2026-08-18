const createClassSchema = {
  body: {
    academic_year_id: { type: 'integer', required: true, min: 1 },
    code: { type: 'string', required: true, minLength: 1, maxLength: 30 },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    grade: { type: 'string', required: false, maxLength: 20 },
    major: { type: 'string', required: false, maxLength: 100 },
    homeroom_teacher_id: { type: 'integer', required: false, min: 1 },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

const updateClassSchema = {
  body: {
    academic_year_id: { type: 'integer', required: false, min: 1 },
    code: { type: 'string', required: false, minLength: 1, maxLength: 30 },
    name: { type: 'string', required: false, minLength: 2, maxLength: 100 },
    grade: { type: 'string', required: false, maxLength: 20 },
    major: { type: 'string', required: false, maxLength: 100 },
    homeroom_teacher_id: { type: 'integer', required: false },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

module.exports = {
  createClassSchema,
  updateClassSchema
};
