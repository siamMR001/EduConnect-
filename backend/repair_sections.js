const mongoose = require('mongoose');
require('dotenv').config();
const gradeSectionController = require('./controllers/gradeSectionController');

// Ensure models are registered
require('./models/User');
require('./models/StudentProfile');
require('./models/Classroom');

const repair = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Classroom = mongoose.model('Classroom');
        const StudentProfile = mongoose.model('StudentProfile');

        // 1. Clean up NULL values and duplicates from all classrooms
        const classrooms = await Classroom.find({});
        console.log(`Checking ${classrooms.length} classrooms...`);

        for (const c of classrooms) {
            const originalCount = c.studentIds.length;
            // Remove nulls and ensure unique IDs
            c.studentIds = [...new Set(c.studentIds.filter(id => id != null).map(id => id.toString()))];
            
            if (c.studentIds.length !== originalCount) {
                console.log(`Room [${c.name}]: Cleaned up ${originalCount - c.studentIds.length} invalid entries.`);
                await Classroom.updateOne({ _id: c._id }, { studentIds: c.studentIds });
            }
        }

        // 2. Find "Orphaned" Students (Registered but not in any classroom students list)
        const profiles = await StudentProfile.find({ user: { $ne: null } });
        console.log(`Checking ${profiles.length} registered students for classroom assignment...`);

        let assignedCount = 0;
        for (const p of profiles) {
            // Check if student's user ID is in ANY classroom
            const assignedClass = await Classroom.findOne({ studentIds: p.user });
            
            if (!assignedClass) {
                console.log(`Student [${p.studentId} - ${p.firstName}] is orphaned. Assigning...`);
                try {
                    await gradeSectionController.performStudentAssignment(
                        p._id, 
                        p.currentClass, 
                        p.academicYear || new Date().getFullYear().toString()
                    );
                    assignedCount++;
                } catch (assignError) {
                    console.error(`Failed to assign ${p.studentId}:`, assignError.message);
                }
            }
        }

        console.log(`Global repair complete. Assigned ${assignedCount} orphaned students.`);
        process.exit(0);
    } catch (err) {
        console.error('Repair failed:', err);
        process.exit(1);
    }
};

repair();
