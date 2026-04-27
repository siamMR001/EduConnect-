const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    createPaymentIntent, 
    submitManualPayment, 
    getPendingPayments, 
    verifyPayment,
    handleWebhook,
    getIncomeHistory,
    createCheckoutSession,
    verifyCheckoutSession,
    createStudentCheckoutSession,
    verifyStudentPayment,
    getStudentPayments
} = require('../controllers/paymentController');

// Multer config for payment proof (receipts)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-proof-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Stripe Webhook
router.post('/webhook', handleWebhook);

// Stripe Payment Intent
router.post('/create-payment-intent', createPaymentIntent);

// Manual Payment Submission (bKash, Rocket, Nagad, Bank)
router.post('/submit-manual', upload.single('paymentProof'), submitManualPayment);

// Admin: Get all pending verifications
router.get('/pending', getPendingPayments);

// Admin: Approve/Reject payment
router.post('/verify', verifyPayment);

// Admin: Get full income history for reporting
router.get('/income-history', getIncomeHistory);

// Stripe Checkout Session
router.post('/create-checkout-session', createCheckoutSession);
router.post('/verify-checkout-session', verifyCheckoutSession);

// Student Profile Payments
router.post('/student/create-checkout-session', createStudentCheckoutSession);
router.post('/student/verify-payment', verifyStudentPayment);
router.get('/student/:studentId', getStudentPayments);

module.exports = router;
