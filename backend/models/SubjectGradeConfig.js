const mongoose = require('mongoose');

const subjectGradeConfigSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    courseId: {
        type: String, // ID of the course in the classroom's courses array
        required: true
    },
    categories: [{
        label: { type: String, required: true }, // e.g., 'Quiz', 'Midterm'
        weight: { type: Number, required: true }, // e.g., 20 (for 20%)
        maxMarks: { type: Number, default: 100 }
    }],
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure uniqueness per classroom/course combo
subjectGradeConfigSchema.index({ classroomId: 1, courseId: 1 }, { unique: true });

const SubjectGradeConfig = mongoose.model('SubjectGradeConfig', subjectGradeConfigSchema);
module.exports = SubjectGradeConfig;
