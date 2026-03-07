const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Admission = require('../models/Admission');

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

// Update application status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Admission.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!application) return res.status(404).json({ message: 'Not found' });
        res.json(application);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
