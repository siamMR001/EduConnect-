const cron = require('node-cron');
const StudentProfile = require('../models/StudentProfile');
const FeeConfig = require('../models/FeeConfig');
const Payment = require('../models/Payment');

// Runs on the 1st of every month at midnight
const generateMonthlyFees = cron.schedule('0 0 1 * *', async () => {
    try {
        console.log('Running monthly cron job to generate due payments...');
        const now = new Date();
        const currentMonth = now.toLocaleString('default', { month: 'long' });
        const currentYear = now.getFullYear().toString();

        // 1. Get all FeeConfigs for the current month or 'All'
        const configs = await FeeConfig.find({
            $or: [
                { month: currentMonth },
                { month: 'All' }
            ]
        });

        if (configs.length === 0) {
            console.log('No fee configurations found for this month.');
            return;
        }

        // 2. Get all active students
        const students = await StudentProfile.find({ status: 'active' });

        for (const student of students) {
            // Find configs applicable to this student's grade
            const applicableConfigs = configs.filter(c => c.grade === student.currentClass);

            for (const config of applicableConfigs) {
                // Check if payment already exists
                const existing = await Payment.findOne({
                    studentId: student.studentId,
                    paymentType: config.paymentType,
                    month: currentMonth,
                    year: currentYear
                });

                if (!existing) {
                    await Payment.create({
                        studentId: student.studentId,
                        paymentType: config.paymentType,
                        month: currentMonth,
                        year: currentYear,
                        amount: config.amount,
                        status: 'Due'
                    });
                }
            }
        }
        console.log('Finished monthly cron job for payments.');
    } catch (err) {
        console.error('Error running payment cron job:', err);
    }
});

module.exports = { generateMonthlyFees };
