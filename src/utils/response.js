/**
 * Standardized API Response Helper
 */
class ApiResponse {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code (default 200)
   * @param {string} message - Human readable message
   * @param {any} data - Response payload data
   * @param {Object|null} meta - Optional pagination/metadata
   */
  static success(res, statusCode = 200, message = 'Success', data = null, meta = null) {
    const responsePayload = {
      success: true,
      message,
      data: data !== null ? data : {}
    };

    if (meta) {
      responsePayload.meta = meta;
    }

    return res.status(statusCode).json(responsePayload);
  }

  /**
   * Send created response (201)
   */
  static created(res, message = 'Resource created successfully', data = null) {
    return this.success(res, 201, message, data);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {string} code - Error code identifier
   * @param {any} details - Additional error details / field validations
   */
  static error(res, statusCode = 500, message = 'Internal Server Error', code = 'INTERNAL_ERROR', details = null) {
    const responsePayload = {
      success: false,
      message,
      error: {
        code
      }
    };

    if (details !== null && details !== undefined) {
      responsePayload.error.details = details;
    }

    return res.status(statusCode).json(responsePayload);
  }
}

module.exports = ApiResponse;
