const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['notice', 'event', 'assignment', 'attendance', 'result', 'submission', 'graded', 'feedback', 'feedback_reply', 'general'],
        default: 'general'
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of notice, event, etc.
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    actionUrl: { type: String }, // URL to navigate to when clicked
    createdAt: { type: Date, default: Date.now, expires: 2592000 } // Auto-delete after 30 days
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
