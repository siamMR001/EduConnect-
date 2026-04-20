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

// Routes - Order matters! More specific routes must come before generic :id routes
router.get('/month/:month/:year', noticeController.getNoticesForMonth);
router.get('/category/:category', noticeController.getNoticesByCategory);
router.get('/', noticeController.getAllNotices);
router.get('/:id', noticeController.getNoticeById);

router.post('/', protect, authorize('admin'), upload.array('attachments', 5), noticeController.createNotice);
router.put('/:id', protect, authorize('admin'), upload.array('attachments', 5), noticeController.updateNotice);
router.delete('/:id', protect, authorize('admin'), noticeController.deleteNotice);

router.get('/:noticeId/download/:attachmentIndex', noticeController.downloadAttachment);

module.exports = router;
