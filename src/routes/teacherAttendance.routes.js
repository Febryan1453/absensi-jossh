const express = require('express');
const teacherAttendanceController = require('../controllers/teacherAttendance.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authenticateDevice } = require('../middlewares/deviceAuth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  teacherCheckInSchema,
  teacherCheckOutSchema,
  teacherManualAttendanceSchema
} = require('../validations/teacherAttendance.validation');

const router = express.Router();

const flexibleAuth = (req, res, next) => {
  if (req.headers['x-device-key'] || req.headers['x-api-key'] || req.headers['x-device-uuid']) {
    return authenticateDevice(req, res, next);
  }
  return authenticateToken(req, res, next);
};

router.post('/check-in', flexibleAuth, validate(teacherCheckInSchema), teacherAttendanceController.checkIn);
router.post('/check-out', flexibleAuth, validate(teacherCheckOutSchema), teacherAttendanceController.checkOut);

router.use(authenticateToken);

router.get('/summary/today', requireRole('admin'), teacherAttendanceController.getTodaySummary);
router.post('/manual', requireRole('admin'), validate(teacherManualAttendanceSchema), teacherAttendanceController.recordManual);

router.get('/', teacherAttendanceController.getAll);
router.get('/:id', teacherAttendanceController.getById);

module.exports = router;
