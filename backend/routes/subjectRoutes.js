const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');
const materialUpload = require('../middleware/materialUpload');

// Materials
router.get('/materials', protect, subjectController.getMaterials);
router.post('/materials', protect, materialUpload.single('file'), subjectController.addMaterial);
router.delete('/materials/:id', protect, subjectController.deleteMaterial);

// Grade Config
router.get('/config', protect, subjectController.getGradeConfig);
router.post('/config', protect, subjectController.updateGradeConfig);

// Student Grades
router.get('/grades', protect, subjectController.getSubjectGrades);
router.post('/grades', protect, subjectController.updateSubjectGrades);

module.exports = router;
