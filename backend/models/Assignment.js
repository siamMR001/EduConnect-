const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    class: {
        type: String,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    attachments: [
        {
            filename: String,
            path: String,
            uploadedAt: { type: Date, default: Date.now }
        }
    ],
    totalMarks: {
        type: Number,
        default: 100
    },
    instructions: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    submissionCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// TTL index to auto-delete inactive assignments after 180 days
assignmentSchema.index({ createdAt: 1 }, { 
    expireAfterSeconds: 15552000, 
    partialFilterExpression: { isActive: false } 
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;
