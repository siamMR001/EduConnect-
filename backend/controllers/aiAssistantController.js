const { GoogleGenerativeAI } = require('@google/generative-ai');
const Result = require('../models/Result');
const Assignment = require('../models/Assignment');
const Notice = require('../models/Notice');
const Attendance = require('../models/Attendance');

const Settings = require('../models/Settings');
const AiSummaryCache = require('../models/AiSummaryCache');
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');
const mammoth = require('mammoth');

/**
 * Extract plain text from a PDF buffer using pdf2json
 */
const extractPdfText = (buffer) => new Promise((resolve, reject) => {
    const parser = new PDFParser(null, 1); // 1 = raw text mode
    parser.on('pdfParser_dataReady', (data) => {
        const text = parser.getRawTextContent();
        resolve(text);
    });
    parser.on('pdfParser_dataError', (err) => {
        reject(new Error(err.parserError || 'PDF parse error'));
    });
    parser.parseBuffer(buffer);
});

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
                const ageInMs = new Date() - cached.createdAt;
                if (ageInMs < 3600000) { // 1 hour
                    return res.json({ summary: cached.summary, cached: true });
                }
            }
        }

        const genAI = await getGenAIInstance();
        if (!genAI) {
            return res.status(500).json({ message: 'AI Service configuration missing.' });
        }

        const context = await getUserContext(req.user._id);

        const prompt = `
            You are a helpful AI Personal Assistant for a student named ${req.user.name || 'Student'} in a school management system called EduConnect. 
            Below is the current context of the student:
            ${JSON.stringify(context, null, 2)}

            Based on this data, provide a very concise (max 3 sentences, bold main points) summary for the student's dashboard. 
            Highlight any urgent deadlines, pending payments (if any), or academic trends. 
            Be encouraging and professional. 
            IMPORTANT: Speak directly to the student.
        `;

        // Try models in order — most capable to most available
        const modelNames = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
        let text = null;
        let lastError = null;

        for (const modelName of modelNames) {
            try {
                logToFile(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                if (response && response.text()) {
                    text = response.text();
                    logToFile(`Success with model: ${modelName}`);
                    break;
                }
            } catch (modelErr) {
                logToFile(`Model ${modelName} failed:`, modelErr.message);
                lastError = modelErr;
            }
        }

        if (!text) {
            throw lastError || new Error('All AI models failed to respond.');
        }

        // Update cache
        await AiSummaryCache.findOneAndUpdate(
            { user: req.user._id },
            { summary: text, createdAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({ summary: text, context: context, cached: false });

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

exports.socraticChat = async (req, res) => {
    try {
        const { messages } = req.body;
        
        const chatApiKey = process.env.GEMINI_CHAT_API_KEY;
        if (!chatApiKey) {
            return res.status(500).json({ message: "Gemini Chat API key missing" });
        }
        const genAI = new GoogleGenerativeAI(chatApiKey);

        const systemInstruction = "You are an expert, encouraging tutor for EduConnect. Your goal is to help students learn, not to do the work for them. If a student asks for the answer to a homework question or assignment, you MUST refuse to give the direct answer. Instead, provide hints, break the problem down into smaller steps, and ask probing questions to help them figure it out themselves. Keep your responses concise, encouraging, and easy to understand.";

        // Use the flash model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction 
        });

        // Convert OpenAI format messages [{role: 'user', content: '...'}] 
        // to Gemini format [{role: 'user', parts: [{text: '...'}]}]
        // Exclude system message if passed in the array
        const history = messages
            .filter(m => m.role !== 'system' && m.role !== 'assistant')
            .slice(0, -1) // All except the very last user message
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));
            
        // Assistant's past messages (for context mapping)
        const allMessages = messages.filter(m => m.role !== 'system');
        const lastMessage = allMessages[allMessages.length - 1].content;

        let geminiHistory = allMessages.slice(0, -1).map(m => ({
             role: m.role === 'user' ? 'user' : 'model',
             parts: [{ text: m.content }]
        }));

        // Gemini strictly requires the history to start with a 'user' role.
        // The frontend initializes with an 'assistant' greeting, so we must drop it.
        while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
            geminiHistory.shift();
        }

        const chat = model.startChat({
            history: geminiHistory
        });

        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({ message: "Chat failed", error: error.message });
    }
};

/**
 * @desc    Extract text from uploaded PDF or DOCX file
 * @route   POST /api/ai/extract-document
 * @access  Private (Student)
 */
exports.extractDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { mimetype, buffer, originalname } = req.file;
        let extractedText = '';

        if (mimetype === 'application/pdf') {
            extractedText = await extractPdfText(buffer);
        } else if (
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimetype === 'application/msword'
        ) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        } else {
            return res.status(400).json({ message: 'Unsupported file type. Please upload a PDF or DOCX file.' });
        }

        // Trim to avoid exceeding free tier token limits (~12000 chars ~= 3000 tokens)
        const maxChars = 12000;
        const trimmed = extractedText.length > maxChars
            ? extractedText.substring(0, maxChars) + '\n\n[Document truncated due to length limit...]'
            : extractedText;

        if (!trimmed.trim()) {
            return res.status(400).json({ message: 'Could not extract readable text from this file.' });
        }

        res.json({
            filename: originalname,
            text: trimmed,
            truncated: extractedText.length > maxChars
        });
    } catch (error) {
        console.error('Document extraction error:', error);
        res.status(500).json({ message: 'Failed to extract document', error: error.message });
    }
};

module.exports = exports;

