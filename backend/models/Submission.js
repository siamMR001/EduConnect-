const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submittedFiles: [
        {
            filename: String,
            path: String,
            uploadedAt: { type: Date, default: Date.now }
        }
    ],
    submissionText: {
        type: String
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    isLate: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'graded', 'resubmitted'],
        default: 'submitted'
    },
    marksObtained: {
        type: Number,
        default: null
    },
    feedback: {
        type: String
    },
    gradedAt: {
        type: Date
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resubmissionDeadline: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for faster queries
submissionSchema.index({ assignment: 1, student: 1 });
submissionSchema.index({ student: 1, status: 1 });

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;
