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

// Get notices for a specific month (for calendar)
exports.getNoticesForMonth = async (req, res) => {
    try {
        const { month, year } = req.params;
        
        // Create start and end dates for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        // Include notices from previous month that might extend into current month
        const extendedStartDate = new Date(startDate);
        extendedStartDate.setDate(extendedStartDate.getDate() - 31);

        const notices = await Notice.find({
            isActive: true,
            $or: [
                { date: { $gte: startDate, $lte: endDate } },  // starts in month
                { expiryDate: { $gte: startDate, $lte: endDate } },  // expires in month
                { date: { $lt: startDate }, expiryDate: { $gt: endDate } }  // spans entire month
            ]
        })
            .select('title date expiryDate category priority content author')
            .populate('author', 'name')
            .sort({ date: -1 })
            .lean();  // lean() returns plain JS objects, much faster

        res.json(notices);
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
        const { title, content, category, priority, targetRole, expiryDate, date } = req.body;
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
            expiryDate,
            date: date ? new Date(date) : null
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

        fs.appendFileSync(path.join(__dirname, '../../test-notice.log'), `Success: ${JSON.stringify(req.body)}\n`);
        res.status(201).json({ notice, message: 'Notice created and notifications sent' });
    } catch (error) {
        fs.appendFileSync(path.join(__dirname, '../../test-notice.log'), `Error: ${error.message} \n Body: ${JSON.stringify(req.body)}\n`);
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

        const { title, content, category, priority, targetRole, expiryDate, date, isActive } = req.body;

        if (title) notice.title = title;
        if (content) notice.content = content;
        if (category) notice.category = category;
        if (priority) notice.priority = priority;
        if (targetRole) notice.targetRole = targetRole;
        if (expiryDate) notice.expiryDate = expiryDate;
        if (date) notice.date = new Date(date);
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
