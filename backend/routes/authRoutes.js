const express = require('express');
const router = express.Router();
const { registerUser, loginUser, registerTeacher } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/register-teacher', registerTeacher);
router.post('/login', loginUser);

module.exports = router;
