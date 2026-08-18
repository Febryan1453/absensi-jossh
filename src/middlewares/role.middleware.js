const { ForbiddenError, UnauthorizedError } = require('../utils/appError');

/**
 * Role-Based Access Control Middleware
 * @param  {...string|Array<string>} roles - Allowed role(s) ('admin', 'teacher', 'student', 'parent')
 */
const requireRole = (...roles) => {
  const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};

const authorize = (roles) => requireRole(roles);

module.exports = {
  requireRole,
  authorize
};
