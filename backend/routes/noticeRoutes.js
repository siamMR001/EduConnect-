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

// Create notice
router.post('/', async (req, res) => {
    try {
        const { title, content, targetRole, priority, author } = req.body;
        const notice = await Notice.create({ title, content, targetRole, priority, author });
        res.status(201).json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update notice
router.put('/:id', async (req, res) => {
    try {
        const { title, content, targetRole, priority } = req.body;
        const notice = await Notice.findByIdAndUpdate(
            req.params.id,
            { title, content, targetRole, priority },
            { new: true }
        );
        if (!notice) return res.status(404).json({ message: 'Notice not found' });
        res.json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete notice
router.delete('/:id', async (req, res) => {
    try {
        const deletedNotice = await Notice.findByIdAndDelete(req.params.id);
        if (!deletedNotice) {
            return res.status(404).json({ message: 'Notice not found' });
        }
        res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
