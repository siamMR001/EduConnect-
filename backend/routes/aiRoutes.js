const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAiSummary } = require('../controllers/aiAssistantController');

// All AI routes are protected
router.use(protect);

router.get('/summary', getAiSummary);

module.exports = router;
