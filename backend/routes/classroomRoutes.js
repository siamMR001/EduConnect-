const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // for xlsx memory buffer
const { protect, authorize } = require('../middleware/auth');
const classroomController = require('../controllers/classroomController');

// --- Global Gradesheet Routes ---
router.get('/gradesheet', protect, classroomController.getGlobalGradesheet);
router.delete('/gradesheet/:resultId', protect, authorize('admin'), classroomController.deleteResult);

// --- Helpers ---
router.get('/helpers/teachers', protect, authorize('admin'), classroomController.getTeachers);
router.get('/helpers/students', protect, authorize('admin', 'teacher'), classroomController.getStudents);

// --- Classroom Rules ---
router.post('/', protect, authorize('admin'), classroomController.createClassroom);
router.get('/', protect, classroomController.getClassrooms);
router.get('/:id', protect, classroomController.getSingleClassroom);
router.patch('/:id', protect, authorize('admin'), classroomController.updateClassroom);
router.patch('/:id/activate', protect, authorize('admin'), classroomController.activateSection);
router.delete('/:id', protect, authorize('admin'), classroomController.deleteClassroom);
router.post('/:id/enroll', protect, authorize('admin', 'teacher'), classroomController.enrollStudent);

// --- Feed ---
router.post('/:id/posts', protect, authorize('teacher'), classroomController.createPost);
router.get('/:id/posts', protect, classroomController.getPosts);
router.patch('/posts/:postId', protect, authorize('teacher'), classroomController.updatePost);
router.delete('/posts/:postId', protect, authorize('teacher'), classroomController.deletePost);
router.post('/posts/:postId/comments', protect, classroomController.createComment);
router.patch('/comments/:commentId', protect, classroomController.updateComment);
router.delete('/comments/:commentId', protect, classroomController.deleteComment);

// --- Assignments ---
router.post('/:id/assignments', protect, authorize('teacher'), classroomController.createAssignment);
router.get('/:id/assignments', protect, classroomController.getAssignments);
router.post('/assignments/:assignmentId/submit', protect, authorize('student'), classroomController.submitAssignment);

// --- Results ---
router.get('/:id/results/template', protect, authorize('teacher'), classroomController.downloadResultTemplate);
router.post('/:id/results/upload', protect, authorize('teacher'), upload.single('file'), classroomController.uploadResults);
router.get('/:id/results', protect, classroomController.getClassroomResults);
router.get('/:id/cumulative-results', protect, classroomController.getCumulativeResults);

module.exports = router;
