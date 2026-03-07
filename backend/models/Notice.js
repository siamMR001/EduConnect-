const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetRole: {
        type: String,
        enum: ['all', 'teacher', 'student_guardian'],
        default: 'all'
    },
    priority: {
        type: String,
        enum: ['normal', 'high', 'urgent'],
        default: 'normal'
    },
    createdAt: { type: Date, default: Date.now }
});

const Notice = mongoose.model('Notice', noticeSchema);
module.exports = Notice;
