const createAcademicYearSchema = {
  body: {
    name: { type: 'string', required: true, minLength: 4, maxLength: 20 },
    start_date: { type: 'date', required: true },
    end_date: { type: 'date', required: true },
    is_active: { type: 'boolean', required: false }
  }
};

const updateAcademicYearSchema = {
  body: {
    name: { type: 'string', required: false, minLength: 4, maxLength: 20 },
    start_date: { type: 'date', required: false },
    end_date: { type: 'date', required: false },
    is_active: { type: 'boolean', required: false }
  }
};

module.exports = {
  createAcademicYearSchema,
  updateAcademicYearSchema
};
