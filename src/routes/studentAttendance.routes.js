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
const flexibleAuth = (req, res, next) => {
  if (req.headers['x-device-key'] || req.headers['x-api-key'] || req.headers['x-device-uuid']) {
    return authenticateDevice(req, res, next);
  }
  return authenticateToken(req, res, next);
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
