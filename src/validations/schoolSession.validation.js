const createSchoolSessionSchema = {
  body: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    start_time: { type: 'time', required: true },
    late_after: { type: 'time', required: true },
    end_time: { type: 'time', required: true },
    check_out_start: { type: 'time', required: false },
    check_out_end: { type: 'time', required: false },
    is_active: { type: 'boolean', required: false }
  }
};

const updateSchoolSessionSchema = {
  body: {
    name: { type: 'string', required: false, minLength: 2, maxLength: 100 },
    start_time: { type: 'time', required: false },
    late_after: { type: 'time', required: false },
    end_time: { type: 'time', required: false },
    check_out_start: { type: 'time', required: false },
    check_out_end: { type: 'time', required: false },
    is_active: { type: 'boolean', required: false }
  }
};

module.exports = {
  createSchoolSessionSchema,
  updateSchoolSessionSchema
};
