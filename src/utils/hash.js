const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password using bcrypt
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare plain text password against hashed password
 * Supports $2y$ (PHP/Laravel standard in seed) and $2a$/$2b$
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  // Standardize $2y$ to $2a$ for bcryptjs compatibility if needed
  const normalizedHash = hashedPassword.replace(/^\$2y\$/, '$2a$');
  return bcrypt.compare(plainPassword, normalizedHash);
};

module.exports = {
  hashPassword,
  comparePassword
};
