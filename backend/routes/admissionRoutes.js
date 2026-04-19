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
        
        // Find maximum IDs in both collections
        const [lastInAdmissions, lastInProfiles] = await Promise.all([
            Admission.findOne({ studentId: prefixRegex }).sort({ studentId: -1 }),
            StudentProfile.findOne({ studentId: prefixRegex }).sort({ studentId: -1 })
        ]);
        
        const seqFromAdmissions = lastInAdmissions?.studentId ? parseInt(lastInAdmissions.studentId.slice(4), 10) : 0;
        const seqFromProfiles = lastInProfiles?.studentId ? parseInt(lastInProfiles.studentId.slice(4), 10) : 0;
        
        const sequence = Math.max(seqFromAdmissions, seqFromProfiles) + 1;

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

// Helper to shift a student from admissions to main profile database without requiring a user login yet.
const shiftToStudentProfile = async (application) => {
    const studentId = application.studentId;
    const profileExists = await StudentProfile.findOne({ studentId });
    if (!profileExists) {
        await StudentProfile.create({
            studentId: studentId,
            firstName: application.firstName || 'Student',
            lastName: application.lastName || 'Profile',
            dateOfBirth: application.dateOfBirth || new Date('2010-01-01'),
            gender: application.gender || 'Other',
            bloodGroup: application.bloodGroup,
            religion: application.religion,
            identificationMarks: application.identificationMarks,
            medicalRecords: application.medicalRecords,
            studentPhoto: application.studentPhoto,
            
            currentClass: application.applyingForClass || '01',
            section: 'A',
            previousSchool: application.previousSchool,
            previousResultSheet: application.previousResultSheet,

            fatherName: application.fatherName,
            fatherPhone: application.fatherPhone,
            fatherEmail: application.fatherEmail,
            fatherOccupation: application.fatherOccupation,
            fatherPhoto: application.fatherPhoto,

            motherName: application.motherName,
            motherPhone: application.motherPhone,
            motherEmail: application.motherEmail,
            motherOccupation: application.motherOccupation,
            motherPhoto: application.motherPhoto,

            guardianName: application.guardianName || application.fatherName || 'Guardian',
            guardianPhone: application.guardianPhone || application.fatherPhone || 'N/A',
            guardianEmail: application.guardianEmail || application.fatherEmail || '',
            guardianRelation: application.guardianRelation,
            guardianOccupation: application.guardianOccupation,
            guardianPhoto: application.guardianPhoto,

            address: typeof application.presentAddress === 'string' ? JSON.parse(application.presentAddress).details : application.presentAddress?.details || 'N/A',
            presentAddress: typeof application.presentAddress === 'string' ? JSON.parse(application.presentAddress) : application.presentAddress,
            permanentAddress: typeof application.permanentAddress === 'string' ? JSON.parse(application.permanentAddress) : application.permanentAddress,
            
            documentsPdf: application.documentsPdf,

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
            await shiftToStudentProfile(app);
            await Admission.findByIdAndDelete(app._id);
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

        if (status === 'approved') {
            await shiftToStudentProfile(application);
            await Admission.findByIdAndDelete(application._id);
            return res.json({ message: 'Application approved and shifted to Student Profiles.', application: { ...application.toObject(), status: 'approved' } });
        }

        // If rejected or pending, keep in admissions and just update status
        application.status = status;
        await application.save();

        res.json({ message: 'Status updated successfully', application });
    } catch (error) {
        console.error("Status Update/Enrollment Error:", error);
        res.status(500).json({ message: 'Server error during update', error: error.message });
    }
});

module.exports = router;
