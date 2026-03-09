const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Using a single document to store global settings
    singletonObj: { type: String, default: 'settings', unique: true },
    admissionFee: { type: Number, default: 500 } // Default fee is 500
});

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
