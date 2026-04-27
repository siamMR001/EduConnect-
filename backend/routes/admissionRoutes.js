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

// Helper to shift a student from admissions to main profile database
const shiftToStudentProfile = async (application) => {
    const studentId = application.studentId;
    if (!studentId) throw new Error("Application is missing a Student ID. Cannot enroll.");

    const profileExists = await StudentProfile.findOne({ studentId });
    if (!profileExists) {
        const appObj = application.toObject ? application.toObject() : application;
        
        // Validate blood group against enum
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        const bloodGroup = validBloodGroups.includes(appObj.bloodGroup) ? appObj.bloodGroup : undefined;

        // Ensure gender is valid for enum
        const validGenders = ['Male', 'Female', 'Other'];
        const gender = validGenders.includes(appObj.gender) ? appObj.gender : 'Other';

        try {
            await StudentProfile.create({
                studentId: studentId,
                firstName: appObj.firstName || 'Student',
                lastName: appObj.lastName || 'Profile',
                dateOfBirth: appObj.dateOfBirth || new Date('2010-01-01'),
                gender: gender,
                bloodGroup: bloodGroup,
                religion: appObj.religion,
                identificationMarks: appObj.identificationMarks,
                medicalRecords: appObj.medicalRecords,
                studentPhoto: appObj.studentPhoto,
                
                currentClass: appObj.applyingForClass || '01',
                section: 'A',
                previousSchool: appObj.previousSchool,
                previousResultSheet: appObj.previousResultSheet,

                fatherName: appObj.fatherName,
                fatherPhone: appObj.fatherPhone,
                fatherEmail: appObj.fatherEmail,
                fatherOccupation: appObj.fatherOccupation,
                fatherPhoto: appObj.fatherPhoto,

                motherName: appObj.motherName,
                motherPhone: appObj.motherPhone,
                motherEmail: appObj.motherEmail,
                motherOccupation: appObj.motherOccupation,
                motherPhoto: appObj.motherPhoto,

                guardianName: appObj.guardianName || appObj.fatherName || 'Guardian',
                guardianPhone: appObj.guardianPhone || appObj.fatherPhone || 'N/A',
                guardianEmail: appObj.guardianEmail || appObj.fatherEmail || '',
                guardianRelation: appObj.guardianRelation,
                guardianOccupation: appObj.guardianOccupation,
                guardianPhoto: appObj.guardianPhoto,

                address: appObj.presentAddress?.details || 'N/A',
                presentAddress: {
                    district: appObj.presentAddress?.district,
                    division: appObj.presentAddress?.division,
                    thana: appObj.presentAddress?.thana,
                    postOffice: appObj.presentAddress?.postOffice,
                    details: appObj.presentAddress?.details
                },
                permanentAddress: {
                    district: appObj.permanentAddress?.district,
                    division: appObj.permanentAddress?.division,
                    thana: appObj.permanentAddress?.thana,
                    postOffice: appObj.permanentAddress?.postOffice,
                    details: appObj.permanentAddress?.details
                },
                
                documentsPdf: appObj.documentsPdf,

                status: 'active',
                registrationPaymentStatus: appObj.paymentStatus === 'paid' ? 'paid' : 'pending',
                paymentMethod: appObj.paymentMethod,
                transactionId: appObj.transactionId,
                paymentProof: appObj.paymentProof,
                paymentIntentId: appObj.paymentIntentId
            });
        } catch (err) {
            console.error("StudentProfile Create Error:", err);
            throw new Error(`Profile creation failed: ${err.message}`);
        }
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
            app.status = 'approved';
            await app.save();
            approvedCount++;
        }

        res.json({ message: `Successfully approved and auto-enrolled ${approvedCount} students.` });
    } catch (error) {
        console.error("Bulk Approve Error:", error);
        res.status(500).json({ message: `Bulk approval failed: ${error.message}` });
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
            application.status = 'approved';
            await application.save();
            return res.json({ message: 'Application approved and shifted to Student Profiles.', application });
        }

        // If rejected or pending, keep in admissions and just update status
        application.status = status;
        await application.save();

        res.json({ message: 'Status updated successfully', application });
    } catch (error) {
        console.error("Status Update/Enrollment Error:", error);
        res.status(500).json({ 
            message: `Update failed: ${error.message}`,
            error: error.message
        });
    }
});

module.exports = router;
