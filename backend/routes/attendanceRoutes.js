const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

router.post('/mark/:classroomId', protect, authorize('teacher', 'admin'), attendanceController.markAttendance);
router.get('/classroom/:classroomId', protect, attendanceController.getClassroomAttendance);
router.get('/stats/:classroomId/:studentId', protect, attendanceController.getStudentStats);

module.exports = router;
