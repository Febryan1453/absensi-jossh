const ApiResponse = require('../utils/response');
const { AppError } = require('../utils/appError');

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || null;

  // Handle MySQL errors gracefully without exposing raw database credentials or queries
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    // Extract duplicate key if possible
    const match = err.sqlMessage ? err.sqlMessage.match(/for key '([^']+)'/) : null;
    message = match
      ? `Duplicate entry conflict detected on constraint: ${match[1]}`
      : 'A record with duplicate unique fields already exists.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'Referenced related record does not exist.';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 409;
    code = 'RECORD_IN_USE';
    message = 'Cannot delete or update this record because it is referenced by other resources.';
  } else if (err.code === 'ER_DATA_TOO_LONG') {
    statusCode = 400;
    code = 'DATA_TOO_LONG';
    message = 'Data value exceeds maximum allowed column length.';
  } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
    statusCode = 400;
    code = 'INVALID_DATA_TYPE';
    message = 'Invalid data type or format provided for database field.';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON_BODY';
    message = 'Malformed JSON body in request payload.';
  }

  // Hide operational internals in production
  if (process.env.NODE_ENV === 'production' && !err.isOperational && statusCode === 500) {
    message = 'An unexpected server error occurred. Please try again later.';
    code = 'INTERNAL_SERVER_ERROR';
    details = null;
  }

  // Log error in development or server console
  if (statusCode >= 500) {
    console.error('💥 [Server Error]:', err);
  }

  return ApiResponse.error(res, statusCode, message, code, details);
};

module.exports = errorHandler;
