const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins
        methods: ["GET", "POST"]
    }
});

// Socket.io connection and event listeners
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
    
    // Listen for live bus tracking updates
    socket.on("bus-location", (data) => {
        // Broadcast the data to all other connected clients
        socket.broadcast.emit("bus-moved", data);
    });

    socket.on("bus-arrived", async (data) => {
        // Broadcast arrival to clients (for Admin/Student popup)
        socket.broadcast.emit("bus-arrived", data);

        // Send email to all students/guardians
        try {
            const User = require('./models/User');
            const sendEmail = require('./utils/emailService');
            
            const students = await User.find({ role: 'student' });
            const message = `Dear Student/Guardian,\n\nThe school bus (${data.driverName}) has arrived at its destination (${data.destName}) on ${data.routeName}.\n\nThank you,\nEduConnect Admin`;
            
            for (const student of students) {
                if (student.email) {
                    await sendEmail({
                        email: student.email,
                        subject: '🚌 School Bus Arrived at Destination',
                        message: message
                    });
                }
            }
            console.log(`Sent arrival emails to ${students.length} students.`);
        } catch (error) {
            console.error('Error sending bus arrival emails:', error);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins for easier testing temporarily
    credentials: true
}));
app.use(cookieParser());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/classrooms', require('./routes/classroomRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/bus-routes', require('./routes/busRouteRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Start Cron Jobs
const { markLateAssignments } = require('./cron/assignmentsCron');
markLateAssignments.start();// Database Connection
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connection established successfully.');
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
// Restart triggered
