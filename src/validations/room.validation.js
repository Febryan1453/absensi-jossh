const createRoomSchema = {
  body: {
    code: { type: 'string', required: true, minLength: 1, maxLength: 30 },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    location: { type: 'string', required: false, maxLength: 150 },
    capacity: { type: 'integer', required: false, min: 0 },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

const updateRoomSchema = {
  body: {
    code: { type: 'string', required: false, minLength: 1, maxLength: 30 },
    name: { type: 'string', required: false, minLength: 2, maxLength: 100 },
    location: { type: 'string', required: false, maxLength: 150 },
    capacity: { type: 'integer', required: false, min: 0 },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

module.exports = {
  createRoomSchema,
  updateRoomSchema
};
