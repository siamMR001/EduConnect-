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

// Routes
router.get('/', noticeController.getAllNotices);
router.get('/:id', noticeController.getNoticeById);
router.get('/category/:category', noticeController.getNoticesByCategory);

router.post('/', protect, authorize('admin', 'teacher'), upload.array('attachments', 5), noticeController.createNotice);
router.put('/:id', protect, authorize('admin', 'teacher'), upload.array('attachments', 5), noticeController.updateNotice);
router.delete('/:id', protect, authorize('admin', 'teacher'), noticeController.deleteNotice);

router.get('/:noticeId/download/:attachmentIndex', noticeController.downloadAttachment);

module.exports = router;
