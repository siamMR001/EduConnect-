const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const gradeSectionController = require('../controllers/gradeSectionController');

// Admin routes - manage grades and sections
router.post('/create-grade', protect, authorize('admin'), gradeSectionController.createGradeConfiguration);
router.get('/all-grades', gradeSectionController.getAllGradeConfigurations);
router.get('/grade-config', gradeSectionController.getGradeConfiguration);
router.patch('/update-section-capacity', protect, authorize('admin'), gradeSectionController.updateSectionCapacity);

// Student assignment routes
router.post('/assign-student/:studentId', protect, authorize('admin'), gradeSectionController.assignStudentToSection);
router.patch('/change-student-section', protect, authorize('admin'), gradeSectionController.changeStudentSection);

// Statistics
router.get('/section-statistics', gradeSectionController.getSectionStatistics);

module.exports = router;
