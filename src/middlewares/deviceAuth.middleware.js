const { pool } = require('../config/database');
const { UnauthorizedError, ForbiddenError } = require('../utils/appError');

/**
 * Middleware to authenticate attendance hardware devices (QR Scanner, RFID Reader, Face Terminal, etc.)
 * Reads 'X-Device-Key' or 'X-API-Key' or 'X-Device-UUID'
 */
const authenticateDevice = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-device-key'] || req.headers['x-api-key'];
    const deviceUuid = req.headers['x-device-uuid'];

    if (!apiKey && !deviceUuid) {
      // If neither is provided, continue (allows fallback to user auth or optional device tagging)
      return next();
    }

    let query = 'SELECT id, uuid, code, name, type, location, status FROM attendance_devices WHERE ';
    const params = [];

    if (apiKey) {
      query += 'api_key = ?';
      params.push(apiKey);
    } else {
      query += 'uuid = ?';
      params.push(deviceUuid);
    }

    const [rows] = await pool.execute(query + ' LIMIT 1', params);

    if (rows.length === 0) {
      throw new UnauthorizedError('Invalid attendance device credentials');
    }

    const device = rows[0];

    if (device.status !== 'active') {
      throw new ForbiddenError('Attendance device is inactive or decommissioned');
    }

    // Update last_seen_at timestamp asynchronously
    pool.execute('UPDATE attendance_devices SET last_seen_at = NOW() WHERE id = ?', [device.id]).catch(() => {});

    req.device = device;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateDevice
};
