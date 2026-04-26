const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const EmployeeID = require('../models/EmployeeID');
const Admission = require('../models/Admission');
const jwt = require('jsonwebtoken');
const gradeSectionController = require('./gradeSectionController');

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
                    const isInstant = ['stripe', 'apple_pay', 'google_pay'].includes(req.body.paymentMethod);
                    
                    if (req.body.paymentIntentId) {
                        existingProfile.paymentIntentId = req.body.paymentIntentId;
                        existingProfile.registrationPaymentStatus = 'paid';
                    } else if (req.body.paymentMethod) {
                        existingProfile.paymentMethod = req.body.paymentMethod;
                        existingProfile.transactionId = req.body.transactionId;
                        existingProfile.registrationPaymentStatus = 'pending_verification';
                    }
                    await existingProfile.save();
                    
                    // Also link studentProfile back to user for direct population support
                    user.studentProfile = existingProfile._id;
                    await user.save();
                    
                    console.log('Dual link established between User and StudentProfile:', existingProfile._id);
                    
                    // --- Automatic Section Assignment ---
                    try {
                        await gradeSectionController.performStudentAssignment(
                            existingProfile._id, 
                            existingProfile.currentClass, 
                            existingProfile.academicYear || new Date().getFullYear().toString()
                        );
                        console.log(`Student ${studentId} automatically assigned to section.`);
                    } catch (assignError) {
                        // We don't fail registration if assignment fails (e.g. no sections deployed yet)
                        console.warn('Auto-assignment during registration failed:', assignError.message);
                    }

                    return res.status(201).json({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        paymentStatus: existingProfile.registrationPaymentStatus,
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
        
        let searchKey = email.trim();

        let user;
        if (!searchKey.includes('@')) {
            // Case-insensitive search for profiles
            const studentProfile = await StudentProfile.findOne({ studentId: { $regex: new RegExp(`^${searchKey}$`, 'i') } });
            const employeeProfile = await EmployeeID.findOne({ employeeId: { $regex: new RegExp(`^${searchKey}$`, 'i') } });
            
            if (studentProfile) {
                if (!studentProfile.user) {
                    return res.status(401).json({ message: 'Student account not registered yet. Please click Register.' });
                }
                user = await User.findById(studentProfile.user);
            } else if (employeeProfile) {
                if (!employeeProfile.user) {
                    return res.status(401).json({ message: 'Employee account not registered yet. Please use the registration link.' });
                }
                user = await User.findById(employeeProfile.user);
            } else {
                // Fallback: search as an email even if no @ is present (unlikely but possible if email was stored without @)
                user = await User.findOne({ email: searchKey.toLowerCase() });
            }
        } else {
            user = await User.findOne({ email: searchKey.toLowerCase() });
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

// Teacher registration using Employee ID and Email with Document Uploads
exports.registerTeacher = async (req, res) => {
    try {
        const { 
            employeeId, email, password, confirmPassword,
            phone, address, fatherName, motherName, religion, maritalStatus, gender, dateOfBirth, city, state
        } = req.body;

        // Validate basic input
        if (!employeeId || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All text fields are required (employeeId, email, password, confirmPassword)' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }



        // Find employee record by ID only (case-insensitive)
        const employee = await EmployeeID.findOne({
            employeeId: { $regex: new RegExp(`^${employeeId.trim()}$`, 'i') }
        });

        if (!employee) {
            return res.status(400).json({ message: 'Invalid employee ID' });
        }

        if (employee.status === 'inactive') {
            return res.status(400).json({ message: 'This employee account is inactive. Please contact admin.' });
        }

        if (employee.user) {
            return res.status(400).json({ message: 'Teacher already registered' });
        }

        // Check if email already has a user or employee record
        const targetEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: targetEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'An account already exists with this email' });
        }
        
        const existingEmployeeWithEmail = await EmployeeID.findOne({ email: targetEmail });
        if (existingEmployeeWithEmail && existingEmployeeWithEmail._id.toString() !== employee._id.toString()) {
            return res.status(400).json({ message: 'An employee record already exists with this email' });
        }

        // Create user account
        const user = await User.create({
            name: `${employee.firstName} ${employee.lastName}`,
            email: targetEmail,
            password,
            role: employee.employeeType === 'teacher' ? 'teacher' : (employee.employeeType === 'employee' ? 'employee' : 'admin'),
            employeeId: employee._id
        });

        // Update personal/professional info
        if (phone) employee.phone = phone;
        if (address) employee.address = address;
        if (fatherName) employee.fatherName = fatherName;
        if (motherName) employee.motherName = motherName;
        if (religion) employee.religion = religion;
        if (maritalStatus) employee.maritalStatus = maritalStatus;
        if (gender) employee.gender = gender;
        if (dateOfBirth) employee.dateOfBirth = new Date(dateOfBirth);
        if (city) employee.city = city;
        if (state) employee.state = state;

        // Store uploaded professional documents
        if (req.files) {
            if (req.files['profilePicture']) {
                employee.profilePicture = `/uploads/teacher_docs/${req.files['profilePicture'][0].filename}`;
            }
            if (req.files['professionalDocs']) {
                // Map the consolidated PDF to cvDocument field (or we could use a new field, but cvDocument is existing)
                employee.cvDocument = `/uploads/teacher_docs/${req.files['professionalDocs'][0].filename}`;
                // Also mark NID and Degrees as referencing this same combined file if needed, 
                // but usually the specific field is fine
                employee.nidDocument = `/uploads/teacher_docs/${req.files['professionalDocs'][0].filename}`;
            }
        }

        // Update employee record with the new email
        employee.email = targetEmail;
        employee.user = user._id;
        employee.status = 'active';
        employee.registeredAt = new Date();
        // Clear deprecated fields just in case
        employee.registrationCode = null;
        employee.codeExpiry = null;
        await employee.save();

        res.status(201).json({
            message: 'Teacher registration successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role)
            }
        });
    } catch (error) {
        console.error('Error registering teacher:', error);
        res.status(500).json({ message: 'Error registering teacher', error: error.message });
    }
};
