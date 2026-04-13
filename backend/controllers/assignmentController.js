const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Get all assignments for a teacher
exports.getTeacherAssignments = async (req, res) => {
    try {
        const { page = 1, limit = 10, subject, class: className } = req.query;
        let filter = { createdBy: req.user._id };

        if (subject) filter.subject = subject;
        if (className) filter.class = className;

        const skip = (page - 1) * limit;

        const assignments = await Assignment.find(filter)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Assignment.countDocuments(filter);

        res.json({
            assignments,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all active assignments for students
exports.getStudentAssignments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, subject } = req.query;
        let filter = { isActive: true };

        if (subject) filter.subject = subject;

        const skip = (page - 1) * limit;

        const assignments = await Assignment.find(filter)
            .populate('createdBy', 'name')
            .sort({ deadline: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get submission status for each assignment
        const assignmentsWithStatus = await Promise.all(
            assignments.map(async (assignment) => {
                const submission = await Submission.findOne({
                    assignment: assignment._id,
                    student: req.user._id
                });

                return {
                    ...assignment.toObject(),
                    submission: submission ? {
                        status: submission.status,
                        submittedAt: submission.submittedAt,
                        isLate: submission.isLate,
                        marksObtained: submission.marksObtained,
                        feedback: submission.feedback
                    } : null
                };
            })
        );

        const total = await Assignment.countDocuments(filter);

        res.json({
            assignments: assignmentsWithStatus,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single assignment by ID
exports.getAssignmentById = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id).populate('createdBy', 'name email');

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Get submission if student is viewing
        let submission = null;
        if (req.user.role === 'student') {
            submission = await Submission.findOne({
                assignment: assignment._id,
                student: req.user._id
            });
        }

        res.json({ assignment, submission });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create assignment (Teacher/Admin only)
exports.createAssignment = async (req, res) => {
    try {
        const { title, description, subject, class: className, deadline, totalMarks, instructions } = req.body;

        if (!title || !description || !subject || !className || !deadline) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = req.files.map(file => ({
                filename: file.originalname,
                path: `/uploads/assignments/${file.filename}`
            }));
        }

        const assignment = await Assignment.create({
            title,
            description,
            subject,
            class: className,
            deadline,
            totalMarks: totalMarks || 100,
            instructions,
            createdBy: req.user._id,
            attachments
        });

        // Create notifications for all students (optional - can be filtered by class)
        const students = await User.find({ role: 'student' });
        if (students.length > 0) {
            await Notification.create({
                title: `New Assignment: ${title}`,
                message: `A new assignment "${title}" has been assigned in ${subject}. Deadline: ${new Date(deadline).toLocaleDateString()}`,
                type: 'assignment',
                recipients: students.map(s => s._id),
                relatedId: assignment._id,
                priority: 'high'
            });
        }

        res.status(201).json({
            message: 'Assignment created successfully',
            assignment
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update assignment (Teacher/Admin only)
exports.updateAssignment = async (req, res) => {
    try {
        let assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if user is the creator or admin
        if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this assignment' });
        }

        const { title, description, subject, class: className, deadline, totalMarks, instructions, isActive } = req.body;

        if (title) assignment.title = title;
        if (description) assignment.description = description;
        if (subject) assignment.subject = subject;
        if (className) assignment.class = className;
        if (deadline) assignment.deadline = deadline;
        if (totalMarks) assignment.totalMarks = totalMarks;
        if (instructions) assignment.instructions = instructions;
        if (isActive !== undefined) assignment.isActive = isActive;

        if (req.files && req.files.length > 0) {
            const newAttachments = req.files.map(file => ({
                filename: file.originalname,
                path: `/uploads/assignments/${file.filename}`
            }));
            assignment.attachments = [...assignment.attachments, ...newAttachments];
        }

        assignment.updatedAt = Date.now();
        await assignment.save();

        res.json({
            message: 'Assignment updated successfully',
            assignment
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete assignment (Teacher/Admin only)
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check authorization
        if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this assignment' });
        }

        // Delete associated files
        assignment.attachments.forEach(attachment => {
            const filePath = path.join(__dirname, '../uploads/assignments', path.basename(attachment.path));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        await Assignment.findByIdAndDelete(req.params.id);

        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Download assignment attachment
exports.downloadAssignmentAttachment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const attachment = assignment.attachments[req.params.attachmentIndex];
        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        const filePath = path.join(__dirname, '../uploads/assignments', path.basename(attachment.path));

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.download(filePath, attachment.filename);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get submissions for an assignment (Teacher only)
exports.getAssignmentSubmissions = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check authorization
        if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view submissions' });
        }

        const submissions = await Submission.find({ assignment: req.params.assignmentId })
            .populate('student', 'name email')
            .sort({ submittedAt: -1 });

        res.json({ submissions });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get assignment stats (Teacher only)
exports.getAssignmentStats = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const submissions = await Submission.find({ assignment: req.params.assignmentId });
        const graded = submissions.filter(s => s.status === 'graded').length;
        const lateSubmissions = submissions.filter(s => s.isLate).length;

        const stats = {
            totalSubmissions: submissions.length,
            graded,
            pending: submissions.length - graded,
            lateSubmissions,
            averageMarks: submissions.length > 0 
                ? (submissions.reduce((acc, s) => acc + (s.marksObtained || 0), 0) / submissions.length).toFixed(2)
                : 0
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
