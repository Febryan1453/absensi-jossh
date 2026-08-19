const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const academicYearRoutes = require('./academicYear.routes');
const classRoutes = require('./class.routes');
const teacherRoutes = require('./teacher.routes');
const studentRoutes = require('./student.routes');
const parentRoutes = require('./parent.routes');
const subjectRoutes = require('./subject.routes');
const roomRoutes = require('./room.routes');
const schoolSessionRoutes = require('./schoolSession.routes');
const deviceRoutes = require('./device.routes');
const teachingScheduleRoutes = require('./teachingSchedule.routes');
const studentAttendanceRoutes = require('./studentAttendance.routes');
const teacherAttendanceRoutes = require('./teacherAttendance.routes');
const attendanceEventRoutes = require('./attendanceEvent.routes');
const notificationRoutes = require('./notification.routes');
const dashboardRoutes = require('./dashboard.routes');
const whatsappRoutes = require('./whatsapp.routes');

const router = express.Router();

// Root API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School Attendance REST API service is healthy and operational',
    timestamp: new Date().toISOString()
  });
});

// Resource Routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/classes', classRoutes);
router.use('/teachers', teacherRoutes);
router.use('/students', studentRoutes);
router.use('/parents', parentRoutes);
router.use('/subjects', subjectRoutes);
router.use('/rooms', roomRoutes);
router.use('/school-sessions', schoolSessionRoutes);
router.use('/devices', deviceRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/teaching-schedules', teachingScheduleRoutes);
router.use('/student-attendances', studentAttendanceRoutes);
router.use('/teacher-attendances', teacherAttendanceRoutes);
router.use('/attendance-events', attendanceEventRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
