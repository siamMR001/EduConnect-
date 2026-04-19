const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            const now = new Date();
            // Store only date part (UTC midnight) for easy comparison
            return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        }
    },
    status: {
        type: String,
        enum: ['present', 'absent'],
        required: true,
        default: 'present'
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to prevent duplicate attendance for a student on the same day in the same classroom
attendanceSchema.index({ studentId: 1, classroomId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
