const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const Classroom = require('./models/Classroom');
const GradeSection = require('./models/GradeSection');
const EmployeeID = require('./models/EmployeeID');
const Admission = require('./models/Admission');

const gradeSectionController = require('./controllers/gradeSectionController');

const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Connected to MongoDB for Registration Migration...");

    // Find all un-registered students
    const unregProfiles = await StudentProfile.find({ $or: [{ user: null }, { user: { $exists: false } }] });
    
    console.log(`Found ${unregProfiles.length} unregistered students in SIS.`);

    let successCount = 0;
    for (const profile of unregProfiles) {
        try {
            // Generate User email. Must be unique. Use studentId
            const email = `${profile.studentId}@educonnect.com`;
            
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    name: `${profile.firstName} ${profile.lastName}`.trim(),
                    email: email,
                    password: 'password123', // Will be hashed by pre-save hook
                    role: 'student'
                });
            }

            // Link them
            profile.user = user._id;
            await profile.save();

            user.studentProfile = profile._id;
            await user.save();

            // Perform Assignment
            try {
                await gradeSectionController.performStudentAssignment(
                    profile._id,
                    profile.currentClass,
                    profile.academicYear || new Date().getFullYear().toString()
                );
                console.log(`Registered and Assigned: [${profile.studentId}] ${profile.firstName} ${profile.lastName}`);
                successCount++;
            } catch (assignErr) {
                console.log(`Registered but failed assignment for ${profile.studentId}: ${assignErr.message}`);
                // This happens if classrooms don't exist yet for this grade.
            }

        } catch (err) {
            console.error(`Error processing ${profile.studentId}:`, err.message);
        }
    }

    // Now, run the cleanup for orphaned registered users just in case
    console.log('\nRunning cleanup for any previously registered but orphaned users...');
    const allProfiles = await StudentProfile.find({ user: { $ne: null } });
    for (const p of allProfiles) {
        const assignedClass = await Classroom.findOne({ studentIds: p.user });
        if (!assignedClass) {
            try {
                 await gradeSectionController.performStudentAssignment(
                    p._id, 
                    p.currentClass, 
                    p.academicYear || new Date().getFullYear().toString()
                );
                console.log(`Assigned orphaned user: [${p.studentId}]`);
            } catch(e) {}
        }
    }

    console.log(`\nRegistration migration complete. Successfully registered and placed ${successCount} out of ${unregProfiles.length} pending students into classrooms.`);
    process.exit(0);

}).catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});
