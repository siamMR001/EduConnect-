const express = require('express');
const router = express.Router();
const { createFeedback, getClassroomFeedback, replyToFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

// Post feedback (Teacher only)
router.post('/', protect, createFeedback);

// Get feedback for a specific classroom
router.get('/classroom/:classroomId', protect, getClassroomFeedback);

// Reply to feedback (Student/Guardian only)
router.put('/:feedbackId/reply', protect, replyToFeedback);

module.exports = router;
