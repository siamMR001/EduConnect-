const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Notice = require('./models/Notice');
const StudentProfile = require('./models/StudentProfile');

const MONGO_URI = process.env.MONGODB_URI;

async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB Atlas.');

        // Clear existing data
        await User.deleteMany();
        await Notice.deleteMany();
        // Drop collection to remove old unique indexes that cause errors
        await mongoose.connection.collection('studentprofiles').drop().catch(err => console.log('No collection to drop yet.'));
        console.log('Cleared existing data.');

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
            role: 'student'
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
        console.log('Created welcome notice.');

        // Create Student Profiles
        const students = [
            {
                user: guardian._id,
                studentId: 'SIC-2026-0001',
                firstName: 'Alexander',
                lastName: 'Wright',
                dateOfBirth: new Date('2010-05-14'),
                gender: 'Male',
                bloodGroup: 'O+',
                currentClass: '07',
                section: 'A',
                rollNumber: 14,
                gpa: 3.85,
                attendance: 94,
                guardianName: 'Robert Wright',
                guardianPhone: '+880 1234-567890',
                guardianEmail: 'robert.w@mail.com',
                address: '123 Avenue Road, Downtown',
                emergencyContact: { name: 'Sarah Wright', phone: '+880 9876-543210', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '06', grade: 'A+', remarks: 'Excellent in Sciences' },
                    { year: '2024', class: '05', grade: 'A', remarks: 'Consistent improvement' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0002',
                firstName: 'Sophia',
                lastName: 'Martinez',
                dateOfBirth: new Date('2010-08-22'),
                gender: 'Female',
                bloodGroup: 'B+',
                currentClass: '07',
                section: 'B',
                rollNumber: 5,
                gpa: 3.92,
                attendance: 97,
                guardianName: 'Carlos Martinez',
                guardianPhone: '+880 1987-654321',
                guardianEmail: 'carlos.m@mail.com',
                address: '45 Oak Street',
                emergencyContact: { name: 'Maria Martinez', phone: '+880 1987-111222', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '06', grade: 'A+', remarks: 'Top performer in Mathematics' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0003',
                firstName: 'Liam',
                lastName: 'Chen',
                dateOfBirth: new Date('2009-11-03'),
                gender: 'Male',
                bloodGroup: 'A-',
                currentClass: '08',
                section: 'A',
                rollNumber: 22,
                gpa: 3.40,
                attendance: 78,
                guardianName: 'Wei Chen',
                guardianPhone: '+880 1122-334455',
                guardianEmail: 'wei.chen@mail.com',
                address: '78 Maple Ave',
                emergencyContact: { name: 'Lin Chen', phone: '+880 1122-998877', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '07', grade: 'B+', remarks: 'Needs improvement in attendance' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0004',
                firstName: 'Emma',
                lastName: 'Watson',
                dateOfBirth: new Date('2008-07-19'),
                gender: 'Female',
                bloodGroup: 'AB+',
                currentClass: '09',
                section: 'C',
                rollNumber: 1,
                gpa: 3.95,
                attendance: 96,
                guardianName: 'John Watson',
                guardianPhone: '+880 1555-667788',
                guardianEmail: 'john.w@mail.com',
                address: '12 Baker Street',
                emergencyContact: { name: 'Mary Watson', phone: '+880 1555-112233', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '08', grade: 'A+', remarks: 'Outstanding overall' },
                    { year: '2024', class: '07', grade: 'A', remarks: 'Strong leadership' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0005',
                firstName: 'Noah',
                lastName: 'Patel',
                dateOfBirth: new Date('2011-02-28'),
                gender: 'Male',
                bloodGroup: 'O-',
                currentClass: '06',
                section: 'A',
                rollNumber: 18,
                gpa: 3.60,
                attendance: 91,
                guardianName: 'Amit Patel',
                guardianPhone: '+880 1444-998877',
                guardianEmail: 'amit.p@mail.com',
                address: '56 Pine Lane',
                emergencyContact: { name: 'Priya Patel', phone: '+880 1444-556677', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '05', grade: 'A-', remarks: 'Good progress in all subjects' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0006',
                firstName: 'Olivia',
                lastName: 'Johnson',
                dateOfBirth: new Date('2009-12-01'),
                gender: 'Female',
                bloodGroup: 'A+',
                currentClass: '08',
                section: 'B',
                rollNumber: 9,
                gpa: 3.78,
                attendance: 93,
                guardianName: 'Mark Johnson',
                guardianPhone: '+880 1333-221100',
                guardianEmail: 'mark.j@mail.com',
                address: '99 Elm Drive',
                emergencyContact: { name: 'Lily Johnson', phone: '+880 1333-445566', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '07', grade: 'A', remarks: 'Excellent in English and Arts' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0007',
                firstName: 'Ethan',
                lastName: 'Brooks',
                dateOfBirth: new Date('2010-03-15'),
                gender: 'Male',
                bloodGroup: 'B-',
                currentClass: '07',
                section: 'A',
                rollNumber: 3,
                gpa: 3.55,
                attendance: 88,
                guardianName: 'David Brooks',
                guardianPhone: '+880 1666-778899',
                guardianEmail: 'david.b@mail.com',
                address: '34 Birch Lane',
                emergencyContact: { name: 'Karen Brooks', phone: '+880 1666-112233', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '06', grade: 'B+', remarks: 'Active in sports' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0008',
                firstName: 'Ava',
                lastName: 'Kim',
                dateOfBirth: new Date('2009-06-20'),
                gender: 'Female',
                bloodGroup: 'O+',
                currentClass: '08',
                section: 'A',
                rollNumber: 7,
                gpa: 3.88,
                attendance: 95,
                guardianName: 'Soo-Jin Kim',
                guardianPhone: '+880 1777-889900',
                guardianEmail: 'soojin.k@mail.com',
                address: '67 Cherry Blossom Road',
                emergencyContact: { name: 'Min-Ho Kim', phone: '+880 1777-334455', relation: 'Father' },
                academicHistory: [
                    { year: '2025', class: '07', grade: 'A+', remarks: 'Exceptional in Music and Sciences' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0009',
                firstName: 'William',
                lastName: 'Davies',
                dateOfBirth: new Date('2011-01-10'),
                gender: 'Male',
                bloodGroup: 'A+',
                currentClass: '06',
                section: 'B',
                rollNumber: 12,
                gpa: 3.20,
                attendance: 85,
                guardianName: 'George Davies',
                guardianPhone: '+880 1888-223344',
                guardianEmail: 'george.d@mail.com',
                address: '101 Pinecrest Road',
                emergencyContact: { name: 'Helen Davies', phone: '+880 1888-556677', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '05', grade: 'B', remarks: 'Good potential' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0010',
                firstName: 'Mia',
                lastName: 'Garcia',
                dateOfBirth: new Date('2008-09-05'),
                gender: 'Female',
                bloodGroup: 'B+',
                currentClass: '09',
                section: 'A',
                rollNumber: 19,
                gpa: 3.98,
                attendance: 98,
                guardianName: 'Roberto Garcia',
                guardianPhone: '+880 1999-778899',
                guardianEmail: 'roberto.g@mail.com',
                address: '88 Sunshine Blvd',
                emergencyContact: { name: 'Isabella Garcia', phone: '+880 1999-334455', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '08', grade: 'A+', remarks: 'Top of her class' },
                    { year: '2024', class: '07', grade: 'A+', remarks: 'Excellent academic record' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0011',
                firstName: 'James',
                lastName: 'Wilson',
                dateOfBirth: new Date('2010-10-15'),
                gender: 'Male',
                bloodGroup: 'O-',
                currentClass: '07',
                section: 'C',
                rollNumber: 4,
                gpa: 3.05,
                attendance: 72,
                guardianName: 'Thomas Wilson',
                guardianPhone: '+880 1555-889900',
                guardianEmail: 'thomas.w@mail.com',
                address: '42 Meadow Lane',
                emergencyContact: { name: 'Sarah Wilson', phone: '+880 1555-112233', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '06', grade: 'C+', remarks: 'Needs to focus more on studies' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0012',
                firstName: 'Chloe',
                lastName: 'Martin',
                dateOfBirth: new Date('2009-04-20'),
                gender: 'Female',
                bloodGroup: 'AB-',
                currentClass: '08',
                section: 'B',
                rollNumber: 15,
                gpa: 3.65,
                attendance: 92,
                guardianName: 'Daniel Martin',
                guardianPhone: '+880 1444-223344',
                guardianEmail: 'daniel.m@mail.com',
                address: '76 Riverside Drive',
                emergencyContact: { name: 'Emma Martin', phone: '+880 1444-556677', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '07', grade: 'A-', remarks: 'Great performance in literature' }
                ],
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0013',
                firstName: 'Benjamin',
                lastName: 'Lee',
                dateOfBirth: new Date('2011-08-30'),
                gender: 'Male',
                bloodGroup: 'A-',
                currentClass: '06',
                section: 'A',
                rollNumber: 2,
                gpa: 3.90,
                attendance: 99,
                guardianName: 'Michael Lee',
                guardianPhone: '+880 1333-667788',
                guardianEmail: 'michael.l@mail.com',
                address: '55 Ocean View Apt',
                emergencyContact: { name: 'Jennifer Lee', phone: '+880 1333-112233', relation: 'Mother' },
                academicHistory: [
                    { year: '2025', class: '05', grade: 'A', remarks: 'Shows great enthusiasm' }
                ],
                status: 'active'
            }
        ];

        await StudentProfile.insertMany(students);
        console.log(`Created ${students.length} student profiles.`);

        console.log('\n✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed database:', error);
        process.exit(1);
    }
}

seedDatabase();
