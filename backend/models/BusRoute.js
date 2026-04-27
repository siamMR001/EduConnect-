const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema({
    routeName: { type: String, required: true },
    startName: { type: String, required: true },
    startLat: { type: Number, required: true },
    startLng: { type: Number, required: true },
    destName: { type: String, required: true },
    destLat: { type: Number, required: true },
    destLng: { type: Number, required: true },
    departureTime: { type: String, required: true }, // e.g. "07:30 AM"
    reachingTime: { type: String, required: true },  // e.g. "08:15 AM"
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BusRoute', busRouteSchema);
