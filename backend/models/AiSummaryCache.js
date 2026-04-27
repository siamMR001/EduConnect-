const mongoose = require('mongoose');

const aiSummaryCacheSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    summary: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 * 24 // TTL index: auto-delete after 24 hours (optional, but good for cleanup)
    }
});

module.exports = mongoose.model('AiSummaryCache', aiSummaryCacheSchema);
