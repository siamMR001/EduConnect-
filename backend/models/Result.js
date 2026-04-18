const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examName: {
        type: String,
        required: true
    },
    subjects: [{
        name: String,
        marksObtained: Number,
        totalMarks: Number,
        grade: String
    }],
    gpa: {
        type: Number,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;
