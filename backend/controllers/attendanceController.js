const Attendance = require('../models/Attendance');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Settings = require('../models/Settings');
const sendEmail = require('../utils/emailService');

// @desc    Mark attendance for a classroom
// @route   POST /api/attendance/mark/:classroomId
// @access  Private (Teacher/Admin)
exports.markAttendance = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { records, date } = req.body; // records: [{ studentId, status }]

        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ message: 'Invalid records format' });
        }

        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

        // Authorization check: Allow any teacher or admin
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Not authorized to mark attendance for this class' });
        }

        const attendanceDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(Date.UTC(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate()));

        const settings = await Settings.findOne({ singletonObj: 'settings' });
        const emailTemplate = settings?.attendanceEmailTemplate || "Student {{studentName}} was absent on {{date}}.";

        const savedRecords = [];
        const emailsToSend = [];

        for (const record of records) {
            const { studentId, status } = record;

            // Update or Create attendance record
            const attendance = await Attendance.findOneAndUpdate(
                { studentId, classroomId, date: startOfDay },
                { status, markedBy: req.user._id },
                { upsert: true, new: true }
            );
            savedRecords.push(attendance);

            // If absent, prepare email alert
            if (status === 'absent') {
                const student = await User.findById(studentId);
                const profile = await StudentProfile.findOne({ user: studentId });
                
                // Safety check: ensure student and profile exist before sending email
                if (student && profile && (profile.guardianEmail || profile.fatherEmail || profile.motherEmail)) {
                    const recipientEmail = profile.guardianEmail || profile.fatherEmail || profile.motherEmail;
                    
                    let personalizedMessage = emailTemplate
                        .replace('{{studentName}}', student.name || 'Student')
                        .replace('{{date}}', startOfDay.toDateString());

                    emailsToSend.push({
                        email: recipientEmail,
                        subject: `Absence Alert: ${student.name || 'Notice'}`,
                        message: personalizedMessage
                    });
                }
            }
        }

        // Trigger emails asynchronously
        emailsToSend.forEach(emailData => sendEmail(emailData));

        res.status(200).json({
            message: 'Attendance marked successfully',
            count: savedRecords.length,
            records: savedRecords
        });

    } catch (error) {
        console.error('Mark Attendance Error:', error);
        res.status(500).json({ 
            message: 'Failed to save attendance records. Please check student data or try again later.', 
            error: error.message 
        });
    }
};

// @desc    Get attendance status for a classroom on a specific date
// @route   GET /api/attendance/classroom/:classroomId
exports.getClassroomAttendance = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { date } = req.query;

        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));

        const records = await Attendance.find({ 
            classroomId, 
            date: startOfDay 
        }).populate('studentId', 'name email');

        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance stats for a student in a classroom
// @route   GET /api/attendance/stats/:classroomId/:studentId
exports.getStudentStats = async (req, res) => {
    try {
        const { classroomId, studentId } = req.params;

        const records = await Attendance.find({ classroomId, studentId });
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = total - present;

        res.status(200).json({
            total,
            present,
            absent,
            percentage: total > 0 ? ((present / total) * 100).toFixed(2) : 100,
            history: records.sort((a, b) => b.date - a.date)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get comprehensive attendance report for a classroom
// @route   GET /api/attendance/summary/:classroomId
exports.getClassroomSummary = async (req, res) => {
    try {
        const { classroomId } = req.params;

        // 1. Get all students in the classroom
        const classroom = await Classroom.findById(classroomId)
            .populate({
                path: 'studentIds',
                select: 'name studentProfile profile',
                populate: [
                    { path: 'studentProfile', select: 'studentId rollNumber' },
                    { path: 'profile', select: 'studentId rollNumber' }
                ]
            });
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

        // Authorization check: Admin, Any Teacher, or Student in class
        const isStudentInClass = classroom.studentIds.some(s => s._id.toString() === req.user._id.toString());
        
        if (req.user.role !== 'admin' && req.user.role !== 'teacher' && !isStudentInClass) {
            return res.status(403).json({ message: 'Not authorized to view this record' });
        }

        // 2. Get all attendance records for this classroom
        const records = await Attendance.find({ classroomId }).sort({ date: 1 });

        // 3. Extract unique dates
        const uniqueDates = Array.from(new Set(records.map(r => r.date.toISOString().split('T')[0]))).sort();

        // 4. Map records by student
        const summary = classroom.studentIds.map(student => {
            const studentRecords = records.filter(r => r.studentId.toString() === student._id.toString());
            
            const attendanceMap = {};
            let presentCount = 0;
            
            studentRecords.forEach(r => {
                const dateKey = r.date.toISOString().split('T')[0];
                attendanceMap[dateKey] = r.status === 'present' ? 'PR' : 'AB';
                if (r.status === 'present') presentCount++;
            });

            const roll = student.studentProfile?.rollNumber || student.profile?.rollNumber || '—';
            const sId = student.studentProfile?.studentId || student.profile?.studentId || '—';

            return {
                studentId: student._id,
                name: student.name,
                roll,
                sId,
                attendance: attendanceMap,
                totalPresent: presentCount,
                totalDays: studentRecords.length
            };
        });

        res.status(200).json({
            dates: uniqueDates,
            summary
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
