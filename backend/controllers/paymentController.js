const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Admission = require('../models/Admission');
const StudentProfile = require('../models/StudentProfile');
const sendEmail = require('../utils/emailService');
const { getPaymentSuccessEmail } = require('../utils/emailTemplates');

exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency, studentId, type } = req.body;

        // --- PROFESSIONAL DEVELOPMENT MODE ---
        const isPlaceholderKey = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('1b2n3m4Q5W');
        
        if (isPlaceholderKey) {
            console.log('🛡️ Stripe Dev Mode: Simulating payment intent for placeholder key.');
            return res.status(200).json({
                clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(7),
                isMock: true
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount || 5000,
            currency: currency || 'bdt',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                studentId: studentId || 'unknown',
                type: type || 'registration',
                baseAmount: (amount / 100).toString() // Store original currency amount
            }
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('❌ Stripe Error:', error.message);
        res.status(500).json({ message: 'Stripe initialization failed', error: error.message });
    }
};

exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { studentId, type, baseAmount } = paymentIntent.metadata;
        const amountCents = paymentIntent.amount;
        const transactionId = paymentIntent.id;
        const actualAmount = baseAmount ? parseFloat(baseAmount) : (amountCents / 100);

        console.log(`💰 Payment succeeded for Student: ${studentId}, Type: ${type}, Amount: ${actualAmount}`);

        try {
            let record;
            let email;
            let name;

            if (type === 'admission') {
                record = await Admission.findOne({ studentId });
                if (record) {
                    record.paymentStatus = 'paid';
                    record.paymentMethod = 'stripe';
                    record.transactionId = transactionId;
                    record.amount = actualAmount;
                    record.status = 'approved';
                    await record.save();
                    email = record.fatherEmail || record.motherEmail || record.guardianEmail;
                    name = `${record.firstName} ${record.lastName}`;
                }
            } else {
                record = await StudentProfile.findOne({ studentId });
                if (record) {
                    record.registrationPaymentStatus = 'paid';
                    record.paymentMethod = 'stripe';
                    record.transactionId = transactionId;
                    record.admissionAmount = actualAmount;
                    await record.save();
                    
                    const User = require('../models/User');
                    const user = await User.findById(record.user);
                    email = user?.email;
                    name = `${record.firstName} ${record.lastName}`;
                }
            }

            if (email) {
                const emailHtml = getPaymentSuccessEmail(name, amountCents, transactionId, type);
                await sendEmail({
                    email: email,
                    subject: '💳 Payment Confirmation - EduConnect Academy',
                    message: `Your payment of ৳${actualAmount.toFixed(2)} was successful.`,
                    html: emailHtml
                });
            }

        } catch (dbError) {
            console.error('Error updating database from webhook:', dbError);
            return res.status(500).json({ error: 'Webhook database update failed' });
        }
    }

    res.json({ received: true });
};

exports.submitManualPayment = async (req, res) => {
    try {
        const { studentId, paymentMethod, transactionId, type, amount } = req.body;
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
            record.amount = parseFloat(amount) || 0;
        } else {
            record.registrationPaymentStatus = 'pending_verification';
            record.admissionAmount = parseFloat(amount) || 0;
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
        const { id, type, status } = req.body;
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

exports.getIncomeHistory = async (req, res) => {
    try {
        // Fetch all paid admissions
        const admissions = await Admission.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 });
        // Fetch all paid profiles
        const profiles = await StudentProfile.find({ registrationPaymentStatus: 'paid' }).sort({ createdAt: -1 });

        const history = [
            ...admissions.map(a => ({
                _id: a._id,
                studentId: a.studentId,
                studentName: `${a.firstName} ${a.lastName}`,
                type: 'Admission Fee',
                amount: a.amount || 500,
                method: a.paymentMethod,
                transactionId: a.transactionId,
                date: a.createdAt
            })),
            ...profiles.map(p => ({
                _id: p._id,
                studentId: p.studentId,
                studentName: `${p.firstName} ${p.lastName}`,
                type: 'Registration Fee',
                amount: p.admissionAmount || 500,
                method: p.paymentMethod,
                transactionId: p.transactionId,
                date: p.createdAt
            }))
        ];

        // Sort by date desc
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json(history);
    } catch (error) {
        console.error('Income History Error:', error);
        res.status(500).json({ message: 'Error fetching income history' });
    }
};
