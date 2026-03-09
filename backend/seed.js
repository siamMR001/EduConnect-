const mongoose = require('mongoose');
const User = require('./models/User');
const Notice = require('./models/Notice');
const StudentProfile = require('./models/StudentProfile');

async function seedDatabase() {
    try {
        await mongoose.connect('mongodb+srv://paro:1234@cluster0.pae5pyr.mongodb.net/eduConnect?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected to MongoDB Atlas.');

        // Clear existing data
        await User.deleteMany();
        await Notice.deleteMany();
        await StudentProfile.deleteMany();

        // Create Admin User
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@educonnect.com',
            password: 'password123',
            role: 'admin'
        });
        console.log('Created Admin:', admin.email);

        // Create Teacher User
        const teacher = await User.create({
            name: 'Jane Smith',
            email: 'teacher@educonnect.com',
            password: 'password123',
            role: 'teacher'
        });
        console.log('Created Teacher:', teacher.email);

        // Create Guardian/Student User
        const guardian = await User.create({
            name: 'John Doe',
            email: 'guardian@educonnect.com',
            password: 'password123',
            role: 'student_guardian'
        });
        console.log('Created Guardian:', guardian.email);

        // Create a Notice
        await Notice.create({
            title: 'Welcome to Edu-Connect',
            content: 'The new school portal is officially live. Please explore the dashboard features.',
            author: admin._id,
            priority: 'high',
            targetRole: 'all'
        });

        // Create a Student Profile for the Guardian
        await StudentProfile.create({
            user: guardian._id,
            studentId: '26071754',
            firstName: 'Emily',
            lastName: 'Doe',
            dateOfBirth: new Date('2010-04-15'),
            gender: 'Female',
            bloodGroup: 'B+',
            currentClass: '07',
            guardianName: guardian.name,
            guardianPhone: '+880 1234-999888',
            guardianEmail: guardian.email,
            address: '45 Green Park, Metropolis',
            academicHistory: [
                { year: '2025', class: '06', grade: 'A', remarks: 'Good progress' }
            ]
        });
        console.log('Created Student Profile for Emily Doe');

        console.log('\n✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed database:', error);
        process.exit(1);
    }
}

seedDatabase();
