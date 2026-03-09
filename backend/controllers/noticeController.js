const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Get all active notices with filtering
exports.getAllNotices = async (req, res) => {
    try {
        const { category, priority, targetRole, page = 1, limit = 10 } = req.query;
        let filter = { isActive: true };

        if (category) filter.category = category;
        if (priority) filter.priority = priority;
        if (targetRole) filter.targetRole = targetRole;

        const skip = (page - 1) * limit;

        const notices = await Notice.find(filter)
            .populate('author', 'name role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notice.countDocuments(filter);

        res.json({ notices, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single notice by ID
exports.getNoticeById = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id).populate('author', 'name role');

        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        // Increment view count
        notice.views += 1;
        await notice.save();

        res.json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Create notice (Admin/Teacher)
exports.createNotice = async (req, res) => {
    try {
        const { title, content, category, priority, targetRole, expiryDate } = req.body;
        const author = req.user._id;

        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = req.files.map(file => ({
                filename: file.originalname,
                filepath: file.path,
                filesize: file.size,
                mimetype: file.mimetype
            }));
        }

        const notice = await Notice.create({
            title,
            content,
            author,
            category: category || 'announcement',
            priority: priority || 'normal',
            targetRole: targetRole || 'all',
            attachments,
            expiryDate
        });

        // Create notifications for recipients
        const recipients = await User.find({
            $or: [
                { role: targetRole === 'all' ? { $exists: true } : targetRole },
                { role: 'admin' }
            ]
        });

        const notificationPromises = recipients.map(recipient =>
            Notification.create({
                recipient: recipient._id,
                sender: author,
                title,
                message: `New notice: ${title}`,
                type: 'notice',
                relatedId: notice._id,
                priority,
                actionUrl: `/notices/${notice._id}`
            })
        );

        await Promise.all(notificationPromises);

        res.status(201).json({ notice, message: 'Notice created and notifications sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update notice (Owner or Admin)
exports.updateNotice = async (req, res) => {
    try {
        let notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        // Check authorization
        if (notice.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this notice' });
        }

        const { title, content, category, priority, targetRole, expiryDate, isActive } = req.body;

        if (title) notice.title = title;
        if (content) notice.content = content;
        if (category) notice.category = category;
        if (priority) notice.priority = priority;
        if (targetRole) notice.targetRole = targetRole;
        if (expiryDate) notice.expiryDate = expiryDate;
        if (isActive !== undefined) notice.isActive = isActive;

        // Handle new file uploads
        if (req.files && req.files.length > 0) {
            const newAttachments = req.files.map(file => ({
                filename: file.originalname,
                filepath: file.path,
                filesize: file.size,
                mimetype: file.mimetype
            }));
            notice.attachments = [...notice.attachments, ...newAttachments];
        }

        notice.updatedAt = Date.now();
        await notice.save();

        res.json({ notice, message: 'Notice updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete notice (Owner or Admin)
exports.deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        // Check authorization
        if (notice.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this notice' });
        }

        // Delete attachments from filesystem
        if (notice.attachments && notice.attachments.length > 0) {
            notice.attachments.forEach(attachment => {
                const filePath = path.join(__dirname, '..', attachment.filepath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        await Notice.findByIdAndDelete(req.params.id);

        res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Download attachment
exports.downloadAttachment = async (req, res) => {
    try {
        const { noticeId, attachmentIndex } = req.params;
        const notice = await Notice.findById(noticeId);

        if (!notice || !notice.attachments[attachmentIndex]) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        const filePath = path.join(__dirname, '..', notice.attachments[attachmentIndex].filepath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.download(filePath, notice.attachments[attachmentIndex].filename);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get notices by category
exports.getNoticesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const notices = await Notice.find({ category, isActive: true })
            .populate('author', 'name role')
            .sort({ createdAt: -1 });

        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
