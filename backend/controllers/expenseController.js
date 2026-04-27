const Expense = require('../models/Expense');
const Admission = require('../models/Admission');
const StudentProfile = require('../models/StudentProfile');
const Payment = require('../models/Payment');

exports.createExpense = async (req, res) => {
    try {
        const { recipientName, recipientId, amount, purpose, description, date, paymentMethod } = req.body;
        
        const expense = new Expense({
            recipientName,
            recipientId,
            amount,
            purpose,
            description,
            date,
            paymentMethod,
            preparedBy: req.user?._id
        });

        await expense.save();
        res.status(201).json({
            message: 'Expense record created successfully',
            expense
        });
    } catch (error) {
        console.error('Create Expense Error:', error);
        res.status(500).json({ message: 'Error creating expense record', error: error.message });
    }
};

exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses' });
    }
};

exports.getFinancialStats = async (req, res) => {
    try {
        const { year } = req.query;
        const stats = [];
        let monthsToFetch = 6;
        let startFromMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();

        if (year) {
            monthsToFetch = 12;
            startFromMonth = 11; // December
            currentYear = parseInt(year);
        }

        for (let i = monthsToFetch - 1; i >= 0; i--) {
            let monthIdx, loopYear;
            
            if (year) {
                monthIdx = (monthsToFetch - 1) - i;
                loopYear = currentYear;
            } else {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                monthIdx = d.getMonth();
                loopYear = d.getFullYear();
            }

            const startOfMonth = new Date(loopYear, monthIdx, 1);
            const endOfMonth = new Date(loopYear, monthIdx + 1, 0);

            // --- Unified Income Calculation ---
            // 1. Admissions
            const admissions = await Admission.find({
                paymentStatus: 'paid',
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });
            const incomeAdmissions = admissions.reduce((sum, a) => sum + (a.admissionFee || a.amount || 0), 0);

            // 2. Profiles (Older system fallback)
            const profiles = await StudentProfile.find({
                registrationPaymentStatus: 'paid',
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });
            const incomeProfiles = profiles.reduce((sum, p) => sum + (p.admissionAmount || 0), 0);

            // 3. New Monthly Payments / Fees
            const payments = await Payment.find({
                status: 'Paid',
                paidAt: { $gte: startOfMonth, $lte: endOfMonth }
            });
            const incomeGeneral = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

            const totalIncome = incomeAdmissions + incomeProfiles + incomeGeneral;

            // Expenses
            const expenses = await Expense.find({
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });
            const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            stats.push({
                month: startOfMonth.toLocaleString('default', { month: 'short' }),
                income: totalIncome,
                expense: totalExpense,
                year: loopYear
            });
        }

        // Summary Stats (Always relative to current month unless specified?)
        const totalStudents = await StudentProfile.countDocuments();
        
        // For summary, if a specific year is chosen, show total for that year?
        // Actually, user might want a month filter in frontend for the cards.
        // For now, let's just return the full list and the current month summary.
        
        const now = new Date();
        const thisMonthIncome = stats.find(s => s.month === now.toLocaleString('default', { month: 'short' }) && s.year === now.getFullYear())?.income || 0;
        const thisMonthExpense = stats.find(s => s.month === now.toLocaleString('default', { month: 'short' }) && s.year === now.getFullYear())?.expense || 0;

        res.status(200).json({
            chartData: stats,
            summary: {
                totalStudents,
                thisMonthIncome,
                thisMonthExpense,
                netProfit: thisMonthIncome - thisMonthExpense
            }
        });
    } catch (error) {
        console.error('Financial Stats Error:', error);
        res.status(500).json({ message: 'Error fetching financial stats' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting expense' });
    }
};
