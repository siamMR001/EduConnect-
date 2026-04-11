const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true, expires: 0 },
    endDate: { type: Date },
    time: { type: String }, // HH:MM format
    location: { type: String },
    link: { type: String },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
        type: String,
        enum: ['academic', 'sports', 'club', 'holiday', 'cultural', 'other'],
        default: 'academic'
    },
    type: {
        type: String,
        enum: ['academic', 'sports', 'club', 'holiday', 'cultural', 'other'],
        default: 'academic'
    },
    description: String,
    targetRole: {
        type: String,
        enum: ['all', 'teacher', 'student_guardian', 'admin'],
        default: 'all'
    },
    capacity: { type: Number },
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachments: [{
        filename: String,
        filepath: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    color: { type: String, default: '#3B82F6' }, // For calendar display
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: {
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
        endDate: Date
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;

