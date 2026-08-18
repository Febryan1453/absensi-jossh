const createDeviceSchema = {
  body: {
    code: { type: 'string', required: true, minLength: 2, maxLength: 50 },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    type: { type: 'string', required: false, enum: ['qr', 'rfid', 'nfc', 'face', 'manual'] },
    location: { type: 'string', required: false, maxLength: 150 },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

const updateDeviceSchema = {
  body: {
    code: { type: 'string', required: false, minLength: 2, maxLength: 50 },
    name: { type: 'string', required: false, minLength: 2, maxLength: 100 },
    type: { type: 'string', required: false, enum: ['qr', 'rfid', 'nfc', 'face', 'manual'] },
    location: { type: 'string', required: false, maxLength: 150 },
    status: { type: 'string', required: false, enum: ['active', 'inactive'] }
  }
};

module.exports = {
  createDeviceSchema,
  updateDeviceSchema
};
