const { GoogleGenerativeAI } = require('@google/generative-ai');
const Result = require('../models/Result');
const Assignment = require('../models/Assignment');
const Notice = require('../models/Notice');
const Attendance = require('../models/Attendance');

const Settings = require('../models/Settings');
const AiSummaryCache = require('../models/AiSummaryCache');
const fs = require('fs');
const path = require('path');

const logToFile = (msg, data = '') => {
    try {
        const logPath = path.join(process.cwd(), 'ai_debug_root.log');
        const timestamp = new Date().toISOString();
        const content = `${timestamp} - ${msg} ${data ? JSON.stringify(data) : ''}\n`;
        fs.appendFileSync(logPath, content);
    } catch (err) {
        console.error('Logging failed:', err);
    }
};

/**
 * Helper to get the Gemini instance with the API Key from DB
 */
const getGenAIInstance = async () => {
    const settings = await Settings.findOne({ singletonObj: 'settings' });
    let apiKey = settings?.geminiApiKey;

    // If not in DB, check .env
    if (!apiKey || apiKey === '') {
        apiKey = process.env.GEMINI_API_KEY;
    }

    // Ignore placeholder
    if (!apiKey || apiKey === '' || apiKey === 'your_api_key_here') {
        logToFile('API Key Missing or Placeholder');
        return null;
    }

    logToFile('Using API Key prefix:', apiKey.substring(0, 10));
    return new GoogleGenerativeAI(apiKey);
};

/**
 * Gather user context for AI analysis
 */
const getUserContext = async (userId) => {
    try {
        // Fetch last 3 exam results
        const results = await Result.find({ studentId: userId })
            .sort({ uploadedAt: -1 })
            .limit(3);

        // Fetch upcoming assignments (active and deadline >= now)
        const upcomingAssignments = await Assignment.find({
            isActive: true,
            deadline: { $gte: new Date() }
        }).sort({ deadline: 1 }).limit(5);

        // Fetch recent notices
        const recentNotices = await Notice.find({
            isActive: true,
            targetRole: { $in: ['all', 'student'] }
        }).sort({ createdAt: -1 }).limit(3);

        // Calculate attendance summary (if available)
        const attendance = await Attendance.find({ studentId: userId })
            .sort({ date: -1 })
            .limit(30);

        const context = {
            academicPerformance: results.map(r => ({
                exam: r.examName,
                gpa: r.gpa,
                subjects: r.subjects.map(s => ({ name: s.name, marks: s.marksObtained, total: s.totalMarks }))
            })),
            deadlines: upcomingAssignments.map(a => ({
                title: a.title,
                subject: a.subject,
                deadline: a.deadline
            })),
            announcements: recentNotices.map(n => ({
                title: n.title,
                priority: n.priority
            })),
            attendanceRate: attendance.length > 0
                ? (attendance.filter(a => a.status === 'present').length / attendance.length * 100).toFixed(2) + '%'
                : 'Data not available'
        };

        return context;
    } catch (error) {
        console.error('Error gathering context:', error);
        return null;
    }
};

/**
 * @desc    Get proactive AI summary for dashboard
 * @route   GET /api/ai/summary
 * @access  Private (Student/Parent)
 */
exports.getAiSummary = async (req, res) => {
    try {
        logToFile('AI Summary Request for User:', req.user?._id);
        const forceRefresh = req.query.refresh === 'true';

        // Check cache first if not forcing refresh
        if (!forceRefresh) {
            const cached = await AiSummaryCache.findOne({ user: req.user._id });
            if (cached) {
                // If cache is less than 1 hour old, return it
                const ageInMs = new Date() - cached.createdAt;
                if (ageInMs < 3600000) { // 1 hour
                    return res.json({
                        summary: cached.summary,
                        cached: true
                    });
                }
            }
        }

        const genAI = await getGenAIInstance();
        if (!genAI) {
            return res.status(500).json({ message: 'AI Service configuration missing.' });
        }

        const context = await getUserContext(req.user._id);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are a helpful AI Personal Assistant for a student named ${req.user.name || 'Student'} in a school management system called EduConnect. 
            Below is the current context of the student:
            ${JSON.stringify(context, null, 2)}

            Based on this data, provide a very concise (max 3 sentences, bold main points) summary for the student's dashboard. 
            Highlight any urgent deadlines, pending payments (if any), or academic trends. 
            Be encouraging and professional. 
            IMPORTANT: Speak directly to the student.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        if (!response) {
            throw new Error('No response from AI service');
        }

        const text = response.text();
        if (!text) {
            throw new Error('Empty response from AI service');
        }

        // Update cache
        await AiSummaryCache.findOneAndUpdate(
            { user: req.user._id },
            { summary: text, createdAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({
            summary: text,
            context: context,
            cached: false
        });
    } catch (error) {
        logToFile('AI Summary Error:', error.message);
        logToFile('AI Summary Error Stack:', error.stack);
        console.error('AI Summary Error:', error);
        res.status(500).json({
            message: 'Failed to generate AI summary',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = exports;

