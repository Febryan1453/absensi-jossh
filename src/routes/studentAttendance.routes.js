const express = require('express');
const studentAttendanceController = require('../controllers/studentAttendance.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authenticateDevice } = require('../middlewares/deviceAuth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  studentCheckInSchema,
  studentCheckOutSchema,
  studentManualAttendanceSchema
} = require('../validations/studentAttendance.validation');

const router = express.Router();

// Attendance Hardware / QR / App Check-in & Check-out endpoints
// Allows Device API Key authentication or Authenticated User Token
/**
 * Either a gate device or a member of staff may record attendance.
 *
 * The user branch now carries a role check, and that is not a formality: it
 * used to fall through to authenticateToken alone, so ANY signed-in account —
 * a parent, or a student — could post a check-in naming any NIS and have that
 * child recorded as present without ever arriving. Recording attendance for
 * someone else is a staff action, and it is now restricted to one.
 */
const staffOnly = requireRole('admin', 'teacher');

const flexibleAuth = (req, res, next) => {
  if (req.headers['x-device-key'] || req.headers['x-api-key']) {
    return authenticateDevice(req, res, next);
  }
  return authenticateToken(req, res, (err) => {
    if (err) return next(err);
    return staffOnly(req, res, next);
  });
};

router.post('/check-in', flexibleAuth, validate(studentCheckInSchema), studentAttendanceController.checkIn);
router.post('/check-out', flexibleAuth, validate(studentCheckOutSchema), studentAttendanceController.checkOut);

// Standard authenticated routes
router.use(authenticateToken);

router.get('/summary/today', requireRole('admin', 'teacher'), studentAttendanceController.getTodaySummary);
router.post('/manual', requireRole('admin', 'teacher'), validate(studentManualAttendanceSchema), studentAttendanceController.recordManual);

router.get('/', studentAttendanceController.getAll);
router.get('/:id', studentAttendanceController.getById);

module.exports = router;
