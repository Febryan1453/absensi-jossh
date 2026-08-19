// NOTE: `role` is supplied by the caller because an administrator legitimately
// needs to choose which kind of account is being created (admin, teacher,
// student, parent). It is only safe to trust it because POST /auth/register is
// gated behind authenticateToken + requireRole('admin') in auth.routes.js.
// The enum below stays as the second line of defence against arbitrary values.
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
