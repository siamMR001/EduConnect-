const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Classroom = require('./models/Classroom');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Connected to MongoDB for Migration...");

    // Find all Classrooms
    const classrooms = await Classroom.find({}).sort({ createdAt: 1 });
    
    // Process unique class numbers
    const uniqueClasses = [...new Set(classrooms.map(c => c.classNumber))];

    for (const classNum of uniqueClasses) {
        console.log(`\nProcessing Class Number: ${classNum}`);
        
        // Find sections for this class number
        const sections = classrooms.filter(c => c.classNumber === classNum);

        // Fetch all student profiles matching this class
        const StudentProfile = require('./models/StudentProfile');
        let classProfiles = await StudentProfile.find({});
        classProfiles = classProfiles.filter(p => parseInt(p.currentClass, 10) === parseInt(classNum, 10));

        // Sort by "serial" (createdAt)
        classProfiles.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB;
        });

        console.log(`Found ${classProfiles.length} students for Class ${classNum}.`);

        // Assign chunks of 30 to each section
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const startIndex = i * 30;
            const endIndex = startIndex + 30;
            const profilesForThisSection = classProfiles.slice(startIndex, endIndex);

            section.studentIds = profilesForThisSection.map(p => p.user);
            await section.save();

            console.log(`-> Assigned ${profilesForThisSection.length} students to ${section.name}`);
        }
    }

    console.log("\nMigration completed successfully.");
    process.exit(0);

}).catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});
