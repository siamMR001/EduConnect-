const BusRoute = require('../models/BusRoute');

// Get all bus routes
exports.getRoutes = async (req, res) => {
    try {
        const routes = await BusRoute.find().sort({ createdAt: -1 });
        res.status(200).json(routes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching routes', error: error.message });
    }
};

// Create a new route (Admin)
exports.createRoute = async (req, res) => {
    try {
        const { routeName, startName, startLat, startLng, destName, destLat, destLng, departureTime, reachingTime } = req.body;
        
        if (!routeName || !startName || !startLat || !startLng || !destName || !destLat || !destLng || !departureTime || !reachingTime) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newRoute = await BusRoute.create(req.body);
        res.status(201).json(newRoute);
    } catch (error) {
        res.status(500).json({ message: 'Error creating route', error: error.message });
    }
};

// Update a route (Admin)
exports.updateRoute = async (req, res) => {
    try {
        const updatedRoute = await BusRoute.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedRoute) return res.status(404).json({ message: 'Route not found' });
        res.status(200).json(updatedRoute);
    } catch (error) {
        res.status(500).json({ message: 'Error updating route', error: error.message });
    }
};

// Delete a route (Admin)
exports.deleteRoute = async (req, res) => {
    try {
        const route = await BusRoute.findByIdAndDelete(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.status(200).json({ message: 'Route deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting route', error: error.message });
    }
};
