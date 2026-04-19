const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use process.cwd() to ensure absolute paths from the project root
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads/teacher_docs');

// Pre-create the upload directory on module load
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
    console.log('Creating Teacher Upload Directory at:', UPLOAD_BASE_DIR);
    fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Double check existence during destination call
        if (!fs.existsSync(UPLOAD_BASE_DIR)) {
            fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
        }
        cb(null, UPLOAD_BASE_DIR);
    },
    filename: (req, file, cb) => {
        // Clean filename and add timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf', 
            'image/jpeg', 
            'image/png', 
            'image/webp',
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type (${file.mimetype}). PDF, JPEG, PNG, and DOCX are allowed.`));
        }
    }
});

module.exports = upload;
