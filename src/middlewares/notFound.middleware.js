const { NotFoundError } = require('../utils/appError');

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} does not exist on this server`));
};

module.exports = notFoundHandler;
