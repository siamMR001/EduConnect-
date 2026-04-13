const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const assignmentController = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

// Multer configuration for assignment uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/assignments');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Routes
// Get all assignments - role-based handling done in controller
router.get('/', protect, assignmentController.getStudentAssignments);

// Get teacher's assignments
router.get('/teacher/all', protect, authorize('admin', 'teacher'), assignmentController.getTeacherAssignments);

// Get assignments statistics (Teacher/Admin only)
router.get('/:assignmentId/stats', protect, authorize('admin', 'teacher'), assignmentController.getAssignmentStats);

// Get submissions for assignment (Teacher/Admin only)
router.get('/:assignmentId/submissions', protect, authorize('admin', 'teacher'), assignmentController.getAssignmentSubmissions);

// Get single assignment
router.get('/:id', protect, assignmentController.getAssignmentById);

// Create assignment (Teacher only)
router.post('/', protect, authorize('teacher'), upload.array('attachments', 5), assignmentController.createAssignment);

// Update assignment (Teacher only)
router.put('/:id', protect, authorize('teacher'), upload.array('attachments', 5), assignmentController.updateAssignment);

// Delete assignment (Teacher only)
router.delete('/:id', protect, authorize('teacher'), assignmentController.deleteAssignment);

// Download assignment attachment
router.get('/:assignmentId/download/:attachmentIndex', assignmentController.downloadAssignmentAttachment);

module.exports = router;
