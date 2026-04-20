const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
        type: String,
        enum: ['academic', 'event', 'announcement', 'holiday', 'emergency', 'other'],
        default: 'announcement'
    },
    targetRole: {
        type: String,
        enum: ['all', 'teacher', 'student'],
        default: 'all'
    },
    priority: {
        type: String,
        enum: ['normal', 'high', 'urgent'],
        default: 'normal'
    },
    date: { type: Date }, // For calendar display
    attachments: [{
        filename: String,
        filepath: String,
        filesize: Number,
        mimetype: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Notice = mongoose.model('Notice', noticeSchema);
module.exports = Notice;
