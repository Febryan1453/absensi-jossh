const registerSchema = {
  body: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 150 },
    email: { type: 'email', required: false, maxLength: 150 },
    password: { type: 'string', required: true, minLength: 6, maxLength: 100 },
    role: { type: 'string', required: true, enum: ['admin', 'teacher', 'student', 'parent'] }
  }
};

const loginSchema = {
  body: {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true }
  }
};

const changePasswordSchema = {
  body: {
    oldPassword: { type: 'string', required: true },
    newPassword: { type: 'string', required: true, minLength: 6, maxLength: 100 }
  }
};

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema
};
