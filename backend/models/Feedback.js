const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    evaluation: {
        participation: { type: String, enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'], default: 'Good' },
        behavior: { type: String, enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'], default: 'Good' },
        academicProgress: { type: String, enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'], default: 'Good' }
    },
    teacherComment: { type: String, required: true },
    parentComment: { type: String, default: null },
    isAcknowledged: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
