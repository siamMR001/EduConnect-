const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Student submits assignment
exports.submitAssignment = async (req, res) => {
    try {
        const { submissionText } = req.body;
        const { assignmentId } = req.params;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if deadline has passed
        const isLate = new Date() > new Date(assignment.deadline);

        // Check for existing submission
        let submission = await Submission.findOne({
            assignment: assignmentId,
            student: req.user._id
        });

        let submittedFiles = [];
        if (req.files && req.files.length > 0) {
            submittedFiles = req.files.map(file => ({
                filename: file.originalname,
                path: `/uploads/submissions/${file.filename}`
            }));
        }

        if (submission) {
            // Update existing submission (resubmission)
            submission.submittedFiles = submittedFiles;
            submission.submissionText = submissionText;
            submission.submittedAt = Date.now();
            submission.isLate = isLate;
            submission.status = 'resubmitted';
        } else {
            // Create new submission
            submission = await Submission.create({
                assignment: assignmentId,
                student: req.user._id,
                submittedFiles,
                submissionText,
                submittedAt: Date.now(),
                isLate,
                status: 'submitted'
            });

            // Update submission count on assignment
            assignment.submissionCount += 1;
            await assignment.save();
        }

        await submission.save();

        // Notify teacher
        const teacher = await User.findById(assignment.createdBy);
        if (teacher) {
            await Notification.create({
                title: `New Submission: ${assignment.title}`,
                message: `${req.user.name} submitted the assignment "${assignment.title}"${isLate ? ' (LATE)' : ''}`,
                type: 'submission',
                recipients: [assignment.createdBy],
                relatedId: submission._id,
                priority: isLate ? 'high' : 'normal'
            });
        }

        res.status(201).json({
            message: 'Assignment submitted successfully',
            submission,
            isLate
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get student's submission for an assignment
exports.getStudentSubmission = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const submission = await Submission.findOne({
            assignment: assignmentId,
            student: req.user._id
        }).populate('assignment', 'title deadline totalMarks');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all submissions by a student
exports.getStudentSubmissions = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        let filter = { student: req.user._id };

        if (status) filter.status = status;

        const skip = (page - 1) * limit;

        const submissions = await Submission.find(filter)
            .populate('assignment', 'title deadline totalMarks subject')
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Submission.countDocuments(filter);

        res.json({
            submissions,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Grade submission (Teacher only)
exports.gradeSubmission = async (req, res) => {
    try {
        const { marksObtained, feedback, resubmissionDeadline } = req.body;
        const submission = await Submission.findById(req.params.submissionId);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        const assignment = await Assignment.findById(submission.assignment);

        // Check authorization
        if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to grade submissions' });
        }

        // Validate marks
        if (marksObtained > assignment.totalMarks) {
            return res.status(400).json({ message: `Marks cannot exceed total marks (${assignment.totalMarks})` });
        }

        submission.marksObtained = marksObtained;
        submission.feedback = feedback;
        submission.gradedAt = Date.now();
        submission.gradedBy = req.user._id;
        submission.status = 'graded';
        if (resubmissionDeadline) {
            submission.resubmissionDeadline = resubmissionDeadline;
        }

        await submission.save();

        // Notify student
        const student = await User.findById(submission.student);
        if (student) {
            await Notification.create({
                title: `Assignment Graded: ${assignment.title}`,
                message: `Your assignment has been graded. Marks: ${marksObtained}/${assignment.totalMarks}`,
                type: 'graded',
                recipients: [submission.student],
                relatedId: submission._id,
                priority: 'normal'
            });
        }

        res.json({
            message: 'Submission graded successfully',
            submission
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Download submission file
exports.downloadSubmissionFile = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.submissionId);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        const file = submission.submittedFiles[req.params.fileIndex];
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(__dirname, '../uploads/submissions', path.basename(file.path));

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.download(filePath, file.filename);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete submission (Student - only before grading)
exports.deleteSubmission = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.submissionId);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check if user is the student
        if (submission.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this submission' });
        }

        // Can only delete if not yet graded
        if (submission.status === 'graded') {
            return res.status(400).json({ message: 'Cannot delete a graded submission' });
        }

        // Delete submitted files
        submission.submittedFiles.forEach(file => {
            const filePath = path.join(__dirname, '../uploads/submissions', path.basename(file.path));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        const assignment = await Assignment.findById(submission.assignment);
        if (assignment) {
            assignment.submissionCount = Math.max(0, assignment.submissionCount - 1);
            await assignment.save();
        }

        await Submission.findByIdAndDelete(req.params.submissionId);

        res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get pending submissions for teacher
exports.getPendingSubmissions = async (req, res) => {
    try {
        // Get all assignments created by this teacher
        const assignments = await Assignment.find({ createdBy: req.user._id });
        const assignmentIds = assignments.map(a => a._id);

        // Get pending submissions for those assignments
        const submissions = await Submission.find({
            assignment: { $in: assignmentIds },
            status: { $in: ['submitted', 'resubmitted'] }
        })
            .populate('student', 'name email')
            .populate('assignment', 'title deadline')
            .sort({ submittedAt: -1 });

        res.json({ submissions });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
