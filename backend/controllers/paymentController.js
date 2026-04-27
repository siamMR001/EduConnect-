const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Admission = require('../models/Admission');
const StudentProfile = require('../models/StudentProfile');
const Payment = require('../models/Payment');
const FeeConfig = require('../models/FeeConfig');
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

// --- STASHED CHANGES FUNCTIONS ---

exports.createCheckoutSession = async (req, res) => {
    try {
        const { amount, studentId, email } = req.body;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required for payment.' });
        }

        console.log(`Creating Checkout Session for Student: ${studentId}, Email: ${email}`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'EduConnect Admission Fee',
                            description: `Admission fee for Student ID: ${studentId}`,
                        },
                        unit_amount: amount || 5000,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            client_reference_id: studentId,
            customer_email: email || undefined, // Stripe fails if empty string
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply`,
            metadata: {
                studentId: studentId
            }
        });

        console.log(`Checkout Session created: ${session.id}`);
        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('CRITICAL: Stripe Checkout Session Creation Failed:', error);
        res.status(500).json({ 
            message: 'Internal Server Error while initializing payment.', 
            error: error.message 
        });
    }
};

exports.verifyCheckoutSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            res.status(200).json({ 
                success: true, 
                studentId: session.client_reference_id || session.metadata.studentId 
            });
        } else {
            res.status(400).json({ success: false, message: 'Payment not completed' });
        }
    } catch (error) {
        console.error('Error verifying checkout session:', error);
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
};

// --- FEE CONFIGURATION FUNCTIONS ---

exports.createFeeConfig = async (req, res) => {
    try {
        const { grade, paymentType, amount, academicYear, month } = req.body;
        
        // Check if config already exists for this combination
        const existing = await FeeConfig.findOne({ grade, paymentType, academicYear, month });
        if (existing) {
            return res.status(400).json({ message: 'Fee configuration already exists for this combination.' });
        }

        const feeConfig = await FeeConfig.create({
            grade,
            paymentType,
            amount,
            academicYear,
            month
        });

        res.status(201).json(feeConfig);
    } catch (error) {
        res.status(500).json({ message: 'Error creating fee configuration', error: error.message });
    }
};

exports.getFeeConfigs = async (req, res) => {
    try {
        const configs = await FeeConfig.find().sort({ createdAt: -1 });
        res.status(200).json(configs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fee configurations' });
    }
};

exports.updateFeeConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const config = await FeeConfig.findByIdAndUpdate(id, updateData, { new: true });
        if (!config) return res.status(404).json({ message: 'Fee configuration not found' });
        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error updating fee configuration' });
    }
};

exports.deleteFeeConfig = async (req, res) => {
    try {
        const { id } = req.params;
        await FeeConfig.findByIdAndDelete(id);
        res.status(200).json({ message: 'Fee configuration deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting fee configuration' });
    }
};

exports.getFeeConfigsByGrade = async (req, res) => {
    try {
        const { grade } = req.params;
        const configs = await FeeConfig.find({ grade });
        res.status(200).json(configs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fee configurations for grade' });
    }
};

exports.getIncomeHistory = async (req, res) => {
    try {
        console.log('--- Fetching Unified Income History ---');
        
        // 1. Fetch from Admission collection (Paid/Approved)
        const admissions = await Admission.find({
            $or: [
                { paymentStatus: 'paid' },
                { paymentStatus: 'Approved' },
                { paymentStatus: 'Paid' }
            ]
        }).sort({ createdAt: -1 });
        
        const admissionHistory = admissions.map(a => ({
            _id: a._id,
            studentName: `${a.firstName} ${a.lastName}`,
            studentId: a.studentId || 'N/A',
            amount: a.admissionFee || a.amount || 0,
            type: 'Admission Fee',
            method: a.paymentMethod || 'Stripe',
            date: a.createdAt,
            transactionId: a.transactionId || a.stripeSessionId || 'N/A'
        }));

        // 2. Fetch from StudentProfile collection (Registration Fees)
        const profilePayments = await StudentProfile.find({
            registrationPaymentStatus: 'paid'
        }).sort({ createdAt: -1 });

        const registrationHistory = profilePayments.map(p => ({
            _id: p._id,
            studentName: `${p.firstName} ${p.lastName}`,
            studentId: p.studentId || 'N/A',
            amount: p.admissionAmount || 0,
            type: 'Registration Fee',
            method: p.paymentMethod || 'Manual', // Restore 'Manual' as fallback for legacy
            date: p.createdAt,
            transactionId: p.transactionId || p.stripeSessionId || 'N/A'
        }));

        // 3. Fetch from new Payment collection (Monthly Fees)
        const payments = await Payment.find({ status: 'Paid' }).sort({ paidAt: -1 });

        const generalHistory = await Promise.all(payments.map(async (p) => {
            let sName = 'Student';
            let sId = p.studentId || 'N/A';
            
            // Manual lookup using the custom string ID
            let profile = await StudentProfile.findOne({ studentId: p.studentId });
            if (!profile) {
                profile = await Admission.findOne({ studentId: p.studentId });
            }

            if (profile) {
                sName = `${profile.firstName} ${profile.lastName}`.trim();
                sId = profile.studentId || p.studentId;
            }

            return {
                _id: p._id,
                studentName: sName,
                studentId: sId,
                amount: p.amount || 0,
                type: p.paymentType || 'General Payment',
                method: p.paymentMethod || 'Stripe',
                date: p.paidAt || p.createdAt,
                transactionId: p.stripeSessionId || 'N/A'
            };
        }));

        // 4. Combine and sort
        const combinedHistory = [...admissionHistory, ...registrationHistory, ...generalHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(`Total Unified Records: ${combinedHistory.length} (Adm: ${admissionHistory.length}, Reg: ${registrationHistory.length}, Gen: ${generalHistory.length})`);
        res.status(200).json(combinedHistory);
    } catch (error) {
        console.error('Unified Income History Error:', error);
        res.status(500).json({ message: 'Error fetching unified income history', error: error.message });
    }
};

exports.createStudentCheckoutSession = async (req, res) => {
    try {
        const { studentId, paymentType, month, year, amount, email } = req.body;

        if (!studentId || !paymentType || !month || !year || !amount) {
            return res.status(400).json({ message: 'Missing required payment fields.' });
        }

        // --- DEVELOPMENT MODE BYPASS ---
        const isPlaceholderKey = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('1b2n3m4Q5W');
        if (isPlaceholderKey) {
            console.log('--- DEV MODE: Simulating Stripe Checkout ---');
            // Simply redirect to success URL with a fake session ID for testing
            const mockSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments?status=success&session_id=mock_session_${Date.now()}`;
            return res.status(200).json({ url: mockSuccessUrl });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `School Payment: ${paymentType}`,
                            description: `${month} ${year} - Student ID: ${studentId}`,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            client_reference_id: studentId,
            customer_email: email || undefined,
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments?status=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments?status=cancelled`,
            metadata: {
                studentId,
                paymentType,
                month,
                year,
                amount: amount.toString()
            }
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Student Checkout Error:', error);
        res.status(500).json({ message: 'Error initializing payment session', error: error.message });
    }
};

exports.verifyStudentPayment = async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        // Check if already processed
        const existing = await Payment.findOne({ stripeSessionId: sessionId });
        if (existing) {
            return res.status(200).json({ success: true, message: 'Already processed' });
        }

        let studentId, paymentType, month, year, amount, paymentIntentId;

        if (sessionId.startsWith('mock_session_')) {
            console.log('--- DEV MODE: Verifying Mock Session ---');
            // For mock sessions, create a real record so the UI updates
            const mockPayment = await Payment.findOneAndUpdate(
                { 
                    studentId: "DEV_TEST", 
                    paymentType: "Monthly Fee", 
                    month: new Date().toLocaleString('default', { month: 'long' }), 
                    year: new Date().getFullYear().toString() 
                },
                {
                    status: 'Paid',
                    stripeSessionId: sessionId,
                    paidAt: new Date(),
                    amount: 500
                },
                { upsert: true, new: true }
            );
            return res.status(200).json({ success: true, payment: mockPayment });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            ({ studentId, paymentType, month, year, amount } = session.metadata);
            paymentIntentId = session.payment_intent;

            // Use upsert to handle both cron-generated dues and on-the-fly virtual dues
            const payment = await Payment.findOneAndUpdate(
                { 
                    studentId, 
                    paymentType, 
                    month, 
                    year 
                },
                {
                    status: 'Paid',
                    stripeSessionId: sessionId,
                    stripePaymentIntentId: paymentIntentId,
                    paidAt: new Date(),
                    amount: parseFloat(amount)
                },
                { 
                    upsert: true, 
                    new: true 
                }
            );

            res.status(200).json({ success: true, payment });
        } else {
            res.status(400).json({ success: false, message: 'Payment not paid' });
        }
    } catch (error) {
        console.error('Verify Student Payment Error:', error);
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
};

exports.getStudentPayments = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // 1. Get student profile to find their class
        const profile = await StudentProfile.findOne({ studentId });
        if (!profile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const studentClass = profile.currentClass;
        if (!studentClass) {
            return res.status(200).json(await Payment.find({ studentId }).sort({ createdAt: -1 })); // Return whatever history exists
        }

        // Handle variations like "7" vs "07"
        const normalizedClass = studentClass.toString().replace(/^0+/, '');
        const paddedClass = normalizedClass.padStart(2, '0');
        const searchGrades = [studentClass, normalizedClass, paddedClass];

        // 2. Fetch all configured fees for this class
        const feeConfigs = await FeeConfig.find({ grade: { $in: searchGrades } });

        // 3. Fetch existing payment records (Paid or generated Due)
        const existingPayments = await Payment.find({ studentId }).sort({ createdAt: -1 });

        // 4. Merge: For each FeeConfig, check if a payment record already exists
        const virtualDues = [];
        for (const config of feeConfigs) {
            const hasPayment = existingPayments.find(p => 
                p.paymentType === config.paymentType && 
                p.month === config.month && 
                p.year === config.academicYear
            );

            if (!hasPayment) {
                // Create a "virtual" due payment based on the admin config
                virtualDues.push({
                    _id: `temp_${config._id}`,
                    studentId: studentId,
                    paymentType: config.paymentType,
                    month: config.month,
                    year: config.academicYear,
                    amount: config.amount,
                    status: 'Due',
                    isVirtual: true,
                    createdAt: config.createdAt
                });
            }
        }

        // Return combined list (Real payments + Virtual dues)
        const combined = [...existingPayments, ...virtualDues].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.status(200).json(combined);
    } catch (error) {
        console.error('Error fetching student payments:', error);
        res.status(500).json({ message: 'Error fetching payments' });
    }
};
