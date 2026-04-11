const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const multer = require('multer');
const path = require('path');

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

const uploadFields = upload.fields([
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'fatherPhoto', maxCount: 1 },
    { name: 'motherPhoto', maxCount: 1 },
    { name: 'guardianPhoto', maxCount: 1 },
    { name: 'previousResultSheet', maxCount: 1 },
    { name: 'documentsPdf', maxCount: 10 }
]);

// Get all student profiles with optional filters
router.get('/', async (req, res) => {
    try {
        const { search, currentClass, section, status, gender } = req.query;
        const filter = {};

        if (currentClass && currentClass !== 'All') filter.currentClass = currentClass;
        if (section && section !== 'All') filter.section = section;
        if (status && status !== 'All') filter.status = status.toLowerCase();
        if (gender && gender !== 'All') filter.gender = gender;

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { studentId: searchRegex },
                { guardianName: searchRegex }
            ];
        }

        const students = await StudentProfile.find(filter)
            .populate('user', 'email role')
            .sort({ createdAt: -1 });

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get stats summary
router.get('/stats', async (req, res) => {
    try {
        const total = await StudentProfile.countDocuments();
        const active = await StudentProfile.countDocuments({ status: 'active' });
        const inactive = total - active;
        const classes = await StudentProfile.distinct('currentClass');

        res.json({
            total,
            active,
            inactive,
            classes: classes.length
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new student profile
router.post('/', async (req, res) => {
    try {
        const student = new StudentProfile(req.body);
        await student.save();
        res.status(201).json(student);
    } catch (error) {
        console.error('Error creating student:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Student ID already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get a single student's profile
router.get('/:id', async (req, res) => {
    try {
        const student = await StudentProfile.findById(req.params.id).populate('user', 'email role');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get profile by User ID
router.get('/user/:userId', async (req, res) => {
    try {
        const student = await StudentProfile.findOne({ user: req.params.userId }).populate('user', 'email role');
        if (!student) return res.status(404).json({ message: 'Profile not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update student profile
router.put('/:id', function (req, res, next) {
    uploadFields(req, res, function (err) {
        if (err) {
            console.error("Upload error:", err);
            return res.status(500).json({ message: 'File upload error', error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Parse nested objects if strings (FormData converts objects to strings)
        if (updateData.presentAddress && typeof updateData.presentAddress === 'string') {
            updateData.presentAddress = JSON.parse(updateData.presentAddress);
        }
        if (updateData.permanentAddress && typeof updateData.permanentAddress === 'string') {
            updateData.permanentAddress = JSON.parse(updateData.permanentAddress);
        }
        if (updateData.academicHistory && typeof updateData.academicHistory === 'string') {
            updateData.academicHistory = JSON.parse(updateData.academicHistory);
        }

        // Map explicitly uploaded files if any exist
        if (req.files) {
            if (req.files['studentPhoto']) updateData.studentPhoto = `/uploads/${req.files['studentPhoto'][0].filename}`;
            if (req.files['fatherPhoto']) updateData.fatherPhoto = `/uploads/${req.files['fatherPhoto'][0].filename}`;
            if (req.files['motherPhoto']) updateData.motherPhoto = `/uploads/${req.files['motherPhoto'][0].filename}`;
            if (req.files['guardianPhoto']) updateData.guardianPhoto = `/uploads/${req.files['guardianPhoto'][0].filename}`;
            if (req.files['previousResultSheet']) updateData.previousResultSheet = `/uploads/${req.files['previousResultSheet'][0].filename}`;
            if (req.files['documentsPdf']) {
                updateData.documentsPdf = req.files['documentsPdf'].map(f => `/uploads/${f.filename}`);
            }
        }

        const student = await StudentProfile.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete student profile
router.delete('/:id', async (req, res) => {
    try {
        const student = await StudentProfile.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
