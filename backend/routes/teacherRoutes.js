const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');
const upload = require('../middleware/uploadMiddleware');

// Helper for multer error handling
const handleMulterUpload = (req, res, next) => {
    const uploadFields = upload.fields([
        { name: 'profilePicture', maxCount: 1 },
        { name: 'professionalDocs', maxCount: 1 }
    ]);

    uploadFields(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.post('/add-teacher', protect, authorize('admin', 'teacher'), handleMulterUpload, teacherController.addTeacher);
router.get('/all-employees', protect, authorize('admin', 'teacher'), teacherController.getAllEmployees);
router.get('/employee/:id', protect, authorize('admin', 'teacher'), teacherController.getEmployeeById);
router.get('/by-employee-id/:employeeId', teacherController.getEmployeeByEmployeeId);
router.patch('/employee/:id/status', protect, authorize('admin', 'teacher'), teacherController.updateEmployeeStatus);
router.put('/employee/:id', protect, authorize('admin', 'teacher'), handleMulterUpload, teacherController.updateEmployee);
router.get('/profile', protect, teacherController.getTeacherProfile);
router.delete('/employee/:id', protect, authorize('admin', 'teacher'), teacherController.deleteEmployee);

module.exports = router;
