const mongoose = require('mongoose');

const subjectGradeSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    courseId: {
        type: String,
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scores: {
        type: Map,
        of: Number,
        default: {}
    },
    totalWeightedScore: {
        type: Number,
        default: 0
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for fast lookups
subjectGradeSchema.index({ classroomId: 1, courseId: 1, studentId: 1 }, { unique: true });

const SubjectGrade = mongoose.model('SubjectGrade', subjectGradeSchema);
module.exports = SubjectGrade;
