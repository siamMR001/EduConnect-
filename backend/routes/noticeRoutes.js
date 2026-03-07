const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');

// Get all notices
router.get('/', async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 }).populate('author', 'name role');
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create notice (Admin/Teacher only in full app, but simple for now)
router.post('/', async (req, res) => {
    try {
        const { title, content, targetRole, priority, author } = req.body;
        const notice = await Notice.create({ title, content, targetRole, priority, author });
        res.status(201).json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
