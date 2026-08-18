const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_not_for_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token containing sanitized user identity
 * @param {Object} payload - User identity object (id, uuid, role, email, status)
 * @returns {string} Signed JWT token
 */
const generateToken = (payload) => {
  const safePayload = {
    id: payload.id,
    uuid: payload.uuid,
    role: payload.role,
    email: payload.email,
    status: payload.status
  };

  return jwt.sign(safePayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verify JWT token
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};
