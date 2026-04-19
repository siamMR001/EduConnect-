const express = require('express');
const router = express.Router();

const eventController = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// Get routes (public)
router.get('/', eventController.getAllEvents);
router.get('/month/:month/:year', eventController.getEventsForMonth);
router.get('/:id', eventController.getEventById);

// Protected routes (admin only)
router.post('/', protect, authorize('admin'), eventController.createEvent);
router.put('/:id', protect, authorize('admin'), eventController.updateEvent);
router.delete('/:id', protect, authorize('admin'), eventController.deleteEvent);

// User registration routes
router.post('/:id/register', protect, eventController.registerForEvent);
router.delete('/:id/unregister', protect, eventController.unregisterFromEvent);

// Update event
router.put('/:id', async (req, res) => {
    try {
        const { title, description, date, location, type, link } = req.body;
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { title, description, date, location, type, link },
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
