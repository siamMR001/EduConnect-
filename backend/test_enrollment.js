const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const Admission = require('./models/Admission');

const uri = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to DB.");

        // Find a pending admission
        const pendingApp = await Admission.findOne({ status: 'pending' });
        if (!pendingApp) {
            console.log("No pending applications found to test with.");
            process.exit(0);
        }

        console.log(`Found pending admission: ${pendingApp.firstName} ${pendingApp.lastName} (${pendingApp.studentId})`);

        // Simulate the PATCH update in the DB directly
        const studentId = pendingApp.studentId;
        const userEmail = pendingApp.guardianEmail || pendingApp.fatherEmail || pendingApp.motherEmail || `${studentId}@educonnect.com`;
        const defaultPassword = `${studentId}`;

        // Check if user exists
        let existingUser = await User.findOne({ email: userEmail });
        let userId;

        if (existingUser) {
            console.log("User already exists:", existingUser.email);
            userId = existingUser._id;
        } else {
            console.log("Creating new User...", userEmail);
            const newUser = await User.create({
                name: pendingApp.guardianName || pendingApp.fatherName || 'Guardian',
                email: userEmail,
                password: defaultPassword,
                role: 'student_guardian'
            });
            userId = newUser._id;
        }

        // Create Student Profile
        const profileExists = await StudentProfile.findOne({ studentId });
        if (!profileExists) {
            console.log("Creating new StudentProfile...");
            await StudentProfile.create({
                user: userId,
                studentId: studentId,
                firstName: pendingApp.firstName,
                lastName: pendingApp.lastName,
                dateOfBirth: pendingApp.dateOfBirth,
                gender: pendingApp.gender,
                bloodGroup: pendingApp.bloodGroup,
                currentClass: pendingApp.applyingForClass,
                section: 'A',
                guardianName: pendingApp.guardianName || pendingApp.fatherName || 'N/A',
                guardianPhone: pendingApp.guardianPhone || pendingApp.fatherPhone || 'N/A',
                guardianEmail: userEmail,
                address: typeof pendingApp.presentAddress === 'string' ? JSON.parse(pendingApp.presentAddress).details : pendingApp.presentAddress?.details || 'N/A',
                status: 'active'
            });
            console.log("StudentProfile created successfully!");
        } else {
            console.log("StudentProfile already exists.");
        }

        // Update Admission Status
        pendingApp.status = 'approved';
        await pendingApp.save();
        console.log("Admission status updated to approved!");

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
