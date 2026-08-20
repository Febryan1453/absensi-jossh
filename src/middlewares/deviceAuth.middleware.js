const { pool } = require('../config/database');
const { UnauthorizedError, ForbiddenError } = require('../utils/appError');

/**
 * Authenticate attendance hardware (gate tablet, RFID reader, face terminal).
 *
 * Reads 'X-Device-Key' or 'X-API-Key'. The api_key is the ONLY device
 * credential.
 *
 * 'X-Device-UUID' used to be accepted here as an equivalent credential, and it
 * could not be one: attendance_devices.uuid is returned verbatim by
 * GET /devices, so every administration screen that lists the gates received a
 * working credential for each of them. It also made key rotation a lie — the
 * one action offered for revoking a lost tablet replaces api_key only, so a
 * device whose uuid was known stayed authenticated forever. A value published
 * by a listing endpoint is an identifier, not a secret, and this middleware now
 * treats it as one.
 */
const authenticateDevice = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-device-key'] || req.headers['x-api-key'];

    if (!apiKey) {
      // No device credential offered. Routes that accept either a device or a
      // user (see flexibleAuth) fall through to user authentication; routes
      // that require a device must check req.device themselves.
      return next();
    }

    const query =
      'SELECT id, uuid, code, name, type, location, status FROM attendance_devices WHERE api_key = ?';
    const params = [apiKey];

    const [rows] = await pool.execute(query + ' LIMIT 1', params);

    if (rows.length === 0) {
      throw new UnauthorizedError('Invalid attendance device credentials');
    }

    const device = rows[0];

    if (device.status !== 'active') {
      throw new ForbiddenError('Attendance device is inactive or decommissioned');
    }

    // Written as a Date, not NOW(): the connection is fixed at UTC, and NOW()
    // is evaluated in the MySQL session timezone. See config/database.js — this
    // one was missed when the other four were fixed, which is why gate rows
    // showed a "last seen" seven hours in the future.
    pool
      .execute('UPDATE attendance_devices SET last_seen_at = ? WHERE id = ?', [new Date(), device.id])
      .catch(() => {});

    req.device = device;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateDevice
};
