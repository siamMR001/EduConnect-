const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const { month, year, category, targetRole } = req.query;
        let filter = {};

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        if (category) filter.category = category;
        if (targetRole) filter.targetRole = targetRole;

        const events = await Event.find(filter)
            .populate('organizer', 'name role')
            .populate('registeredUsers', 'name email')
            .sort({ date: 1 });

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name role')
            .populate('registeredUsers', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Create event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, endDate, time, location, category, targetRole, capacity, color } = req.body;
        const organizer = req.user._id;

        const event = await Event.create({
            title,
            description,
            date,
            endDate,
            time,
            location,
            organizer,
            category: category || 'academic',
            targetRole: targetRole || 'all',
            capacity,
            color: color || '#3B82F6'
        });

        // Send notifications
        const recipients = await User.find({
            $or: [
                { role: targetRole === 'all' ? { $exists: true } : targetRole },
                { role: 'admin' }
            ]
        });

        const notificationPromises = recipients.map(recipient =>
            Notification.create({
                recipient: recipient._id,
                sender: organizer,
                title,
                message: `New event: ${title} on ${new Date(date).toDateString()}`,
                type: 'event',
                relatedId: event._id,
                actionUrl: `/events/${event._id}`
            })
        );

        await Promise.all(notificationPromises);

        const populatedEvent = await event.populate('organizer', 'name role');

        res.status(201).json({ event: populatedEvent, message: 'Event created and notifications sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update event
exports.updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check authorization
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        const { title, description, date, endDate, time, location, category, targetRole, capacity, color } = req.body;

        if (title) event.title = title;
        if (description) event.description = description;
        if (date) event.date = date;
        if (endDate) event.endDate = endDate;
        if (time) event.time = time;
        if (location) event.location = location;
        if (category) event.category = category;
        if (targetRole) event.targetRole = targetRole;
        if (capacity) event.capacity = capacity;
        if (color) event.color = color;

        event.updatedAt = Date.now();
        await event.save();

        res.json({ event, message: 'Event updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check authorization
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await Event.findByIdAndDelete(req.params.id);

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Register user for event
exports.registerForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const userId = req.user._id;

        if (event.registeredUsers.includes(userId)) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        if (event.capacity && event.registeredUsers.length >= event.capacity) {
            return res.status(400).json({ message: 'Event is full' });
        }

        event.registeredUsers.push(userId);
        await event.save();

        res.json({ message: 'Successfully registered for event', event });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Unregister from event
exports.unregisterFromEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const userId = req.user._id;

        event.registeredUsers = event.registeredUsers.filter(id => id.toString() !== userId.toString());
        await event.save();

        res.json({ message: 'Successfully unregistered from event', event });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get events for calendar month
exports.getEventsForMonth = async (req, res) => {
    try {
        const { month, year } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const events = await Event.find({
            date: { $gte: startDate, $lte: endDate }
        })
            .populate('organizer', 'name role')
            .sort({ date: 1 });

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
