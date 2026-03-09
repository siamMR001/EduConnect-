const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const noticeController = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/notices');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

<<<<<<< HEAD
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Routes
router.get('/', noticeController.getAllNotices);
router.get('/:id', noticeController.getNoticeById);
router.get('/category/:category', noticeController.getNoticesByCategory);

router.post('/', protect, authorize('admin', 'teacher'), upload.array('attachments', 5), noticeController.createNotice);
router.put('/:id', protect, authorize('admin', 'teacher'), upload.array('attachments', 5), noticeController.updateNotice);
router.delete('/:id', protect, authorize('admin', 'teacher'), noticeController.deleteNotice);

router.get('/:noticeId/download/:attachmentIndex', noticeController.downloadAttachment);
=======
// Create notice
router.post('/', async (req, res) => {
    try {
        const { title, content, targetRole, priority, author } = req.body;
        const notice = await Notice.create({ title, content, targetRole, priority, author });
        res.status(201).json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update notice
router.put('/:id', async (req, res) => {
    try {
        const { title, content, targetRole, priority } = req.body;
        const notice = await Notice.findByIdAndUpdate(
            req.params.id,
            { title, content, targetRole, priority },
            { new: true }
        );
        if (!notice) return res.status(404).json({ message: 'Notice not found' });
        res.json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete notice
router.delete('/:id', async (req, res) => {
    try {
        const deletedNotice = await Notice.findByIdAndDelete(req.params.id);
        if (!deletedNotice) {
            return res.status(404).json({ message: 'Notice not found' });
        }
        res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
>>>>>>> 5de90c1af608c6774214142d6808372edd0abbcd

module.exports = router;
