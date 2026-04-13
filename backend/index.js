const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins for easier testing temporarily
    credentials: true
}));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Basic Route for testing
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Edu-Connect Backend is running! 🚀' });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/grades', require('./routes/gradeSectionRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admissions', require('./routes/admissionRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));





// Database Connection
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connection established successfully.');
        app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
