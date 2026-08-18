const { verifyToken } = require('../utils/jwt');
const { UnauthorizedError, ForbiddenError } = require('../utils/appError');
const { pool } = require('../config/database');

/**
 * JWT Authentication Middleware
 * Reads 'Authorization: Bearer <JWT>' header, verifies token, checks user status, sets req.user.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is missing or malformed');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Access token is empty');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired');
      }
      throw new UnauthorizedError('Invalid access token');
    }

    // Verify user exists and is active in database
    const [rows] = await pool.execute(
      'SELECT id, uuid, name, email, role, status FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (rows.length === 0) {
      throw new UnauthorizedError('User associated with this token no longer exists');
    }

    const user = rows[0];

    if (user.status === 'blocked') {
      throw new ForbiddenError('Your account has been blocked. Please contact administrator');
    }

    if (user.status === 'inactive') {
      throw new ForbiddenError('Your account is currently inactive');
    }

    // Set authenticated user payload to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken
};
