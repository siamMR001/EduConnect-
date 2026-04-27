const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        ref: 'StudentProfile'
    },
    paymentType: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: true,
        enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    },
    year: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Paid', 'Due'],
        default: 'Due'
    },
    stripeSessionId: {
        type: String,
        unique: true,
        sparse: true
    },
    stripePaymentIntentId: {
        type: String
    },
    paidAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
