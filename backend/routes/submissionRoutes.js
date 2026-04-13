const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const submissionController = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

// Multer configuration for submission uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/submissions');
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
// Submit assignment (Student only)
router.post('/:assignmentId/submit', protect, authorize('student'), upload.array('submittedFiles', 5), submissionController.submitAssignment);

// Get student's submissions
router.get('/student/all', protect, authorize('student'), submissionController.getStudentSubmissions);

// Get single student submission
router.get('/:submissionId/student', protect, authorize('student'), submissionController.getStudentSubmission);

// Grade submission (Teacher/Admin only)
router.put('/:submissionId/grade', protect, authorize('admin', 'teacher'), submissionController.gradeSubmission);

// Download submission file
router.get('/:submissionId/download/:fileIndex', protect, submissionController.downloadSubmissionFile);

// Delete submission (Student only - before grading)
router.delete('/:submissionId', protect, authorize('student'), submissionController.deleteSubmission);

module.exports = router;
