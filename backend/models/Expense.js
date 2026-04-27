const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    voucherNo: {
        type: String,
        unique: true,
        required: true
    },
    recipientName: {
        type: String,
        required: true
    },
    recipientId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        default: 'Cash'
    },
    preparedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-generate voucher number (e.g., VCH-2026-0001)
expenseSchema.pre('validate', async function() {
    if (this.isNew && !this.voucherNo) {
        const year = new Date().getFullYear();
        const lastExpense = await mongoose.model('Expense').findOne({
            voucherNo: new RegExp(`^VCH-${year}-`)
        }).sort({ voucherNo: -1 });

        let sequence = 1;
        if (lastExpense) {
            const lastSeq = parseInt(lastExpense.voucherNo.split('-')[2]);
            sequence = lastSeq + 1;
        }

        this.voucherNo = `VCH-${year}-${sequence.toString().padStart(4, '0')}`;
    }
});

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
