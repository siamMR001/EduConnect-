const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Admission = require('../models/Admission');
const StudentProfile = require('../models/StudentProfile');

exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount || 5000,
            currency: currency || 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ message: 'Error creating payment intent', error: error.message });
    }
};

exports.submitManualPayment = async (req, res) => {
    try {
        const { studentId, paymentMethod, transactionId, type } = req.body;
        let paymentProof = '';

        if (req.file) {
            paymentProof = `/uploads/${req.file.filename}`;
        }

        let record;
        if (type === 'admission') {
            record = await Admission.findOne({ studentId });
        } else {
            record = await StudentProfile.findOne({ studentId });
        }

        if (!record) {
            return res.status(404).json({ message: 'Registration record not found' });
        }

        record.paymentMethod = paymentMethod;
        record.transactionId = transactionId;
        if (paymentProof) record.paymentProof = paymentProof;
        
        if (type === 'admission') {
            record.paymentStatus = 'pending_verification';
        } else {
            record.registrationPaymentStatus = 'pending_verification';
        }

        await record.save();

        res.status(200).json({ 
            message: 'Payment details submitted and pending verification.',
            status: 'pending_verification'
        });
    } catch (error) {
        console.error('Manual payment submission error:', error);
        res.status(500).json({ message: 'Error submitting payment details', error: error.message });
    }
};

exports.getPendingPayments = async (req, res) => {
    try {
        const pendingAdmissions = await Admission.find({ paymentStatus: 'pending_verification' });
        const pendingProfiles = await StudentProfile.find({ registrationPaymentStatus: 'pending_verification' });

        res.status(200).json({
            admissions: pendingAdmissions,
            profiles: pendingProfiles
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending payments' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { id, type, status } = req.body; // status: 'paid' or 'unpaid' / 'failed'
        let record;
        
        if (type === 'admission') {
            record = await Admission.findById(id);
        } else {
            record = await StudentProfile.findById(id);
        }

        if (!record) return res.status(404).json({ message: 'Record not found' });

        if (type === 'admission') {
            record.paymentStatus = status;
        } else {
            record.registrationPaymentStatus = status;
        }

        await record.save();
        res.status(200).json({ message: `Payment ${status} successfully.` });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying payment' });
    }
};
