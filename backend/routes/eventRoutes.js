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

module.exports = router;
