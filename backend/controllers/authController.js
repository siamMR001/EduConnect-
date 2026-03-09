const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student_guardian',
        });

        if (user) {
            // Auto-create StudentProfile for student_guardian role
            if (role === 'student_guardian' || !role) {
                try {
                    const studentProfile = await StudentProfile.create({
                        user: user._id,
                        studentId: `${new Date().getFullYear()}${Math.random().toString().slice(2, 7)}`, // Auto-generated
                        firstName: name.split(' ')[0],
                        lastName: name.split(' ')[1] || '',
                        dateOfBirth: new Date('2010-01-01'), // Default, can be updated later
                        gender: 'Other',
                        currentClass: '09',
                        guardianName: name,
                        guardianPhone: '',
                        guardianEmail: email,
                        status: 'active'
                    });
                    console.log('StudentProfile created:', studentProfile._id);
                } catch (profileError) {
                    console.log('Note: StudentProfile creation skipped, can be created later');
                }
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
