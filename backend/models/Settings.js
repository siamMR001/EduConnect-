const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Using a single document to store global settings
    singletonObj: { type: String, default: 'settings', unique: true },
    admissionFee: { type: Number, default: 500 },
    attendanceEmailTemplate: { 
        type: String, 
        default: "Dear Guardian,\n\nWe would like to inform you that your ward, {{studentName}}, was marked ABSENT today ({{date}}) at EduConnect Academy.\n\nPlease ensure their regular attendance for optimal academic progress.\n\nRegards,\nEduConnect Administration" 
    },
    monthlyBusFare: { type: Number, default: 100 },
    busFinePerDay: { type: Number, default: 10 }
});

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
