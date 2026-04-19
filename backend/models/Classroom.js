const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    classNumber: {
        type: Number,
        required: true
    },
    section: {
        type: String, // Manual entry: Sunrise, Horizon, Jupiter, etc.
        required: true
    },
    capacity: {
        type: Number,
        default: 30
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leadSubject: {
        type: String,
        required: true
    },
    leadSchedule: [{
        day: { type: String, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
        startTime: String,
        endTime: String
    }],
    courses: [{
        courseName: String,
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        schedule: [{
            day: { type: String, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
            startTime: String,
            endTime: String
        }]
    }],
    studentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    academicYear: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Classroom = mongoose.model('Classroom', classroomSchema);
module.exports = Classroom;
