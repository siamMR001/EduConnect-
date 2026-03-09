const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Helper to get or create the singleton settings object
const getOrCreateSettings = async () => {
    let settings = await Settings.findOne({ singletonObj: 'settings' });
    if (!settings) {
        settings = await Settings.create({ singletonObj: 'settings' });
    }
    return settings;
};

// GET /api/settings - Fetch all settings
router.get('/', async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json(settings);
    } catch (error) {
        console.error("Settings GET Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/settings - Update settings (Admin only ideally)
router.put('/', async (req, res) => {
    try {
        const { admissionFee } = req.body;

        let settings = await getOrCreateSettings();

        if (admissionFee !== undefined) {
            settings.admissionFee = admissionFee;
        }

        await settings.save();
        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error("Settings PUT Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
