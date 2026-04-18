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
        type: String, // Sunrise, Horizon, Nova, Ember
        required: true
    },
    capacity: {
        type: Number,
        default: 30,
        max: 30
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Classroom = mongoose.model('Classroom', classroomSchema);
module.exports = Classroom;
