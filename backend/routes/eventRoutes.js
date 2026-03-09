const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 }).populate('organizer', 'name role');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create event
router.post('/', async (req, res) => {
    try {
        const { title, description, date, location, type, organizer } = req.body;
        const event = await Event.create({ title, description, date, location, type, organizer });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update event
router.put('/:id', async (req, res) => {
    try {
        const { title, description, date, location, type } = req.body;
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { title, description, date, location, type },
            { new: true }
        );
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete event
router.delete('/:id', async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
