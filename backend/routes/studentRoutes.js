const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');

// Get all student profiles (Admin/Teacher view)
router.get('/', async (req, res) => {
    try {
        const students = await StudentProfile.find().populate('user', 'email role');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single student's profile (Guardian/Student view or Teacher view)
router.get('/:id', async (req, res) => {
    try {
        const student = await StudentProfile.findById(req.params.id).populate('user', 'email role');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get profile by User ID (for logged in generic guardian/student)
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
router.put('/:id', async (req, res) => {
    try {
        const student = await StudentProfile.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
