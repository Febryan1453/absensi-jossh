const updateNotificationSchema = {
  body: {
    status: { type: 'string', required: true, enum: ['pending', 'sent', 'failed', 'read'] }
  }
};

module.exports = {
  updateNotificationSchema
};
