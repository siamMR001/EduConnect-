const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    day: {
        type: String,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    startTime: {
        type: String, // format "HH:mm" (24h)
        required: true
    },
    endTime: {
        type: String, // format "HH:mm" (24h)
        required: true
    },
    roomNumber: {
        type: String
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

// Helper to check if two time slots overlap
// Assumes time is in "HH:mm" string format
timetableSchema.statics.isOverlapping = function(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
};

const Timetable = mongoose.model('Timetable', timetableSchema);
module.exports = Timetable;
