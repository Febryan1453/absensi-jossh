const updateUserSchema = {
  body: {
    name: { type: 'string', required: false, minLength: 2, maxLength: 150 },
    email: { type: 'email', required: false, maxLength: 150 },
    role: { type: 'string', required: false, enum: ['admin', 'teacher', 'student', 'parent'] },
    status: { type: 'string', required: false, enum: ['active', 'inactive', 'blocked'] }
  }
};

const resetPasswordSchema = {
  body: {
    // Same floor as registerSchema and changePasswordSchema. Applying a
    // different rule on this one path would only surprise whoever runs into
    // it; if the floor is to be raised it should be raised everywhere at once.
    password: { type: 'string', required: true, minLength: 6, maxLength: 100 }
  }
};

module.exports = {
  updateUserSchema,
  resetPasswordSchema
};
