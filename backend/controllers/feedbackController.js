const Feedback = require('../models/Feedback');
const Classroom = require('../models/Classroom');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create Feedback (Teacher Only)
exports.createFeedback = async (req, res) => {
    try {
        const { classroomId, studentId, evaluation, teacherComment } = req.body;
        
        // Ensure user is teacher
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Only teachers can submit feedback' });
        }

        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

        const feedback = await Feedback.create({
            classroom: classroomId,
            teacher: req.user._id,
            student: studentId,
            evaluation,
            teacherComment
        });

        // Notify student
        await Notification.create({
            title: `New Progress Report: ${classroom.subjectName}`,
            message: `Your teacher ${req.user.name} has posted a new progress report for you.`,
            type: 'feedback',
            recipient: studentId,
            relatedId: feedback._id,
            priority: 'normal'
        });

        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Feedback by Classroom
exports.getClassroomFeedback = async (req, res) => {
    try {
        const { classroomId } = req.params;
        
        let filter = { classroom: classroomId };

        // If student, only show their own feedback
        if (req.user.role === 'student') {
            filter.student = req.user._id;
        }

        const feedbackList = await Feedback.find(filter)
            .populate('student', 'name email rollNumber')
            .populate('teacher', 'name email')
            .sort({ createdAt: -1 });

        res.json(feedbackList);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reply to Feedback (Student/Guardian Only)
exports.replyToFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const { parentComment } = req.body;

        const feedback = await Feedback.findById(feedbackId).populate('classroom');
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

        // Ensure user is the student whose feedback this is
        if (req.user.role === 'student' && feedback.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reply to this feedback' });
        }

        feedback.parentComment = parentComment;
        feedback.isAcknowledged = true;
        await feedback.save();

        // Notify teacher
        await Notification.create({
            title: `Guardian Reply: ${feedback.classroom.subjectName}`,
            message: `A guardian has replied to your feedback for ${req.user.name}.`,
            type: 'feedback_reply',
            recipient: feedback.teacher,
            relatedId: feedback._id,
            priority: 'normal'
        });

        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
