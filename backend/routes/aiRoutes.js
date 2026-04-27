const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { getAiSummary, socraticChat, extractDocument } = require('../controllers/aiAssistantController');

// Use memory storage so we don't write temp files to disk
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All AI routes are protected
router.use(protect);

router.get('/summary', getAiSummary);
router.post('/chat', socraticChat);
router.post('/extract-document', upload.single('document'), extractDocument);

module.exports = router;
