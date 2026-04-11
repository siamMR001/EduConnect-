const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Admission = require('../models/Admission');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role, studentId } = req.body;
        const requestedRole = role || 'student';

        // Additional validation for student
        let existingProfile = null;
        if (requestedRole === 'student') {
            if (!studentId) {
                return res.status(400).json({ message: 'Student/Application ID is required to create a student account' });
            }

            // Check if profile exists (meaning it was shifted by admin approval)
            existingProfile = await StudentProfile.findOne({ studentId });
            if (!existingProfile) {
                return res.status(400).json({ message: 'No approved admission found for this Student ID. Please ensure your admission is approved.' });
            }

            // Check if it already has a user attached
            if (existingProfile.user) {
                return res.status(400).json({ message: 'An account has already been registered and linked to this Student ID' });
            }
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User (email) already exists' });
        }

        const user = await User.create({
            name: name || (existingProfile ? `${existingProfile.firstName} ${existingProfile.lastName}`.trim() : 'Student'),
            email,
            password,
            role: requestedRole,
        });

        if (user) {
            // Update StudentProfile for student
            if (requestedRole === 'student') {
                try {
                    existingProfile.user = user._id;
                    await existingProfile.save();
                    console.log('StudentProfile successfully claimed by new user:', existingProfile._id);

                    return res.status(201).json({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        token: generateToken(user._id, user.role),
                    });
                } catch (profileError) {
                    console.error('Failed to link profile:', profileError.message);
                    await User.findByIdAndDelete(user._id);
                    return res.status(500).json({ message: 'Internal error while claiming profile. Please contact admin.', error: profileError.message });
                }
            } else {
                return res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    token: generateToken(user._id, user.role),
                });
            }
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

        let user;
        if (!email.includes('@')) {
            const studentProfile = await StudentProfile.findOne({ studentId: email });
            if (studentProfile) {
                user = await User.findById(studentProfile.user);
            } else {
                user = await User.findOne({ email });
            }
        } else {
            user = await User.findOne({ email });
        }

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
