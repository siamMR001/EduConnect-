const mongoose = require('mongoose');

const feeConfigSchema = new mongoose.Schema({
    grade: {
        type: String,
        required: true
    },
    paymentType: {
        type: String,
        required: true,
        enum: ['Tuition Fee', 'Library Fee', 'Transportation Fee', 'Exam Fee', 'Sports Fee', 'Other']
    },
    amount: {
        type: Number,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: true,
        enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'All']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FeeConfig', feeConfigSchema);
