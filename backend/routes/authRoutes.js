const express = require('express');
const router = express.Router();
const { registerUser, loginUser, registerTeacher } = require('../controllers/authController');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerUser);
router.post('/register-teacher', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'professionalDocs', maxCount: 1 }
]), registerTeacher);
router.post('/login', loginUser);

module.exports = router;
