const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    createPaymentIntent, 
    submitManualPayment, 
    getPendingPayments, 
    verifyPayment 
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

// Stripe Payment Intent
router.post('/create-payment-intent', createPaymentIntent);

// Manual Payment Submission (bKash, Rocket, Nagad, Bank)
router.post('/submit-manual', upload.single('paymentProof'), submitManualPayment);

// Admin: Get all pending verifications
router.get('/pending', getPendingPayments);

// Admin: Approve/Reject payment
router.post('/verify', verifyPayment);

module.exports = router;
