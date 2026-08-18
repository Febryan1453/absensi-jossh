const createSubjectSchema = {
  body: {
    code: { type: 'string', required: true, minLength: 1, maxLength: 30 },
    name: { type: 'string', required: true, minLength: 2, maxLength: 150 },
    description: { type: 'string', required: false },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

const updateSubjectSchema = {
  body: {
    code: { type: 'string', required: false, minLength: 1, maxLength: 30 },
    name: { type: 'string', required: false, minLength: 2, maxLength: 150 },
    description: { type: 'string', required: false },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

module.exports = {
  createSubjectSchema,
  updateSubjectSchema
};
