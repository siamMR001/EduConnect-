const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Admin only operations
router.post('/', authorize('admin'), timetableController.addTimeSlot);
router.delete('/:id', authorize('admin'), timetableController.deleteTimeSlot);

// General viewing
router.get('/classroom/:classroomId', timetableController.getClassroomTimetable);
router.get('/teacher/:teacherId', timetableController.getTeacherTimetable);

module.exports = router;
