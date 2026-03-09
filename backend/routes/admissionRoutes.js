const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Admission = require('../models/Admission');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Define expected file fields
const uploadFields = upload.fields([
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'fatherPhoto', maxCount: 1 },
    { name: 'motherPhoto', maxCount: 1 },
    { name: 'guardianPhoto', maxCount: 1 },
    { name: 'previousResultSheet', maxCount: 1 },
    { name: 'documentsPdf', maxCount: 10 }
]);

// Generate Next Student ID for Preview
router.get('/generate-id', async (req, res) => {
    try {
        const classStr = req.query.classCode || '01';
        const year = new Date().getFullYear().toString().slice(-2);
        const classCode = classStr.padStart(2, '0');

        const prefixRegex = new RegExp(`^${year}${classCode}`);
        const lastAdmission = await Admission.findOne({
            studentId: prefixRegex
        }).sort({ studentId: -1 });

        let sequence = 1;
        if (lastAdmission && lastAdmission.studentId) {
            const lastSeqStr = lastAdmission.studentId.slice(4);
            sequence = parseInt(lastSeqStr, 10) + 1;
        }

        const seqCode = sequence.toString().padStart(4, '0');
        const nextId = `${year}${classCode}${seqCode}`;

        res.json({ studentId: nextId });
    } catch (error) {
        console.error("Generate ID Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit new admission application
router.post('/', function (req, res, next) {
    uploadFields(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error("Multer upload error:", err);
            return res.status(400).json({ message: 'File upload error', error: err.message });
        } else if (err) {
            console.error("Unknown upload error:", err);
            return res.status(500).json({ message: 'Unknown upload error', error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const admissionData = { ...req.body };
        console.log("Admission Data Received:", admissionData);
        console.log("Files Received:", req.files ? Object.keys(req.files) : "None");

        // Parse nested JSON strings from FormData
        if (admissionData.presentAddress) admissionData.presentAddress = JSON.parse(admissionData.presentAddress);
        if (admissionData.permanentAddress) admissionData.permanentAddress = JSON.parse(admissionData.permanentAddress);

        // Map uploaded files to schema paths
        if (req.files) {
            if (req.files['studentPhoto']) admissionData.studentPhoto = `/uploads/${req.files['studentPhoto'][0].filename}`;
            if (req.files['fatherPhoto']) admissionData.fatherPhoto = `/uploads/${req.files['fatherPhoto'][0].filename}`;
            if (req.files['motherPhoto']) admissionData.motherPhoto = `/uploads/${req.files['motherPhoto'][0].filename}`;
            if (req.files['guardianPhoto']) admissionData.guardianPhoto = `/uploads/${req.files['guardianPhoto'][0].filename}`;
            if (req.files['previousResultSheet']) admissionData.previousResultSheet = `/uploads/${req.files['previousResultSheet'][0].filename}`;

            if (req.files['documentsPdf']) {
                admissionData.documentsPdf = req.files['documentsPdf'].map(f => `/uploads/${f.filename}`);
            }
        }

        const newAdmission = await Admission.create(admissionData);
        res.status(201).json({
            message: 'Application submitted successfully',
            studentId: newAdmission.studentId,
            status: newAdmission.status
        });
    } catch (error) {
        console.error("Admission DB Error:", error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Duplicate application detected.' });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});

// Get all applications (Admin view)
router.get('/', async (req, res) => {
    try {
        const applications = await Admission.find().sort({ createdAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function for auto-enrollment
const autoEnrollStudent = async (application) => {
    const studentId = application.studentId;
    const userEmail = application.guardianEmail || application.fatherEmail || application.motherEmail || `${studentId}@educonnect.com`;
    const defaultPassword = `${studentId}`;

    // 1. Create User Account for Guardian/Student
    let existingUser = await User.findOne({ email: userEmail });
    let userId;

    if (existingUser) {
        userId = existingUser._id;
    } else {
        const newUser = await User.create({
            name: application.guardianName || application.fatherName || 'Guardian',
            email: userEmail,
            password: defaultPassword,
            role: 'student_guardian'
        });
        userId = newUser._id;
    }

    // 2. Create Student Profile
    const profileExists = await StudentProfile.findOne({ studentId });
    if (!profileExists) {
        await StudentProfile.create({
            user: userId,
            studentId: studentId,
            firstName: application.firstName,
            lastName: application.lastName,
            dateOfBirth: application.dateOfBirth,
            gender: application.gender,
            bloodGroup: application.bloodGroup,
            currentClass: application.applyingForClass,
            section: 'A', // Default to section A
            guardianName: application.guardianName || application.fatherName || 'N/A',
            guardianPhone: application.guardianPhone || application.fatherPhone || 'N/A',
            guardianEmail: userEmail,
            address: typeof application.presentAddress === 'string' ? JSON.parse(application.presentAddress).details : application.presentAddress?.details || 'N/A',
            status: 'active'
        });
    }
};

// Bulk Approve All Pending Applications
router.patch('/approve-all-pending', async (req, res) => {
    try {
        const pendingApps = await Admission.find({ status: 'pending' });

        if (pendingApps.length === 0) {
            return res.status(404).json({ message: 'No pending applications found to approve.' });
        }

        let approvedCount = 0;
        for (const app of pendingApps) {
            await autoEnrollStudent(app);
            app.status = 'approved';
            await app.save();
            approvedCount++;
        }

        res.json({ message: `Successfully approved and auto-enrolled ${approvedCount} students.` });
    } catch (error) {
        console.error("Bulk Approve Error:", error);
        res.status(500).json({ message: 'Server error during bulk approval', error: error.message });
    }
});

// Update application status & Auto-Enrollment
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Admission.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Admission application not found' });
        }

        // Auto-Enrollment logic when status turns strictly to 'approved'
        if (status === 'approved' && application.status !== 'approved') {
            await autoEnrollStudent(application);
        }

        // Finally, update the status
        application.status = status;
        await application.save();

        res.json({ message: 'Status updated successfully', application });
    } catch (error) {
        console.error("Status Update/Enrollment Error:", error);
        res.status(500).json({ message: 'Server error during update', error: error.message });
    }
});

module.exports = router;
