const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

// Admin routes - manage teachers
router.post('/add-teacher', protect, authorize('admin'), teacherController.addTeacher);
router.get('/all-employees', protect, authorize('admin'), teacherController.getAllEmployees);
router.get('/employee/:id', protect, authorize('admin'), teacherController.getEmployeeById);
router.get('/by-employee-id/:employeeId', teacherController.getEmployeeByEmployeeId);
router.post('/verify-registration-code', teacherController.verifyRegistrationCode);
router.patch('/employee/:id/status', protect, authorize('admin'), teacherController.updateEmployeeStatus);
router.patch('/employee/:id/regenerate-code', protect, authorize('admin'), teacherController.regenerateRegistrationCode);
router.delete('/employee/:id', protect, authorize('admin'), teacherController.deleteEmployee);

module.exports = router;
