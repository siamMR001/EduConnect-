const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const EmployeeID = require('./models/EmployeeID');
const GradeSection = require('./models/GradeSection');
const Notice = require('./models/Notice');
const StudentProfile = require('./models/StudentProfile');

const MONGO_URI = process.env.MONGODB_URI;

async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB Atlas.');

        // Clear existing data
        await User.deleteMany();
        await EmployeeID.deleteMany();
        await GradeSection.deleteMany();
        await Notice.deleteMany();
        await StudentProfile.deleteMany();
        console.log('Cleared existing data.');

        // Create Admin User
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@educonnect.com',
            password: 'password123',
            role: 'admin'
        });
        console.log('Created Admin:', admin.email);

        // Create Teacher Employee IDs (without user account - they'll register via registration link)
        const teachers = [
            {
                employeeId: 'TCH-2026-0001',
                employeeType: 'teacher',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@educonnect.com',
                phone: '+880 1234-567890',
                gender: 'Female',
                department: 'Mathematics',
                subject: 'Mathematics',
                status: 'pending'
            },
            {
                employeeId: 'TCH-2026-0002',
                employeeType: 'teacher',
                firstName: 'John',
                lastName: 'Wilson',
                email: 'john.wilson@educonnect.com',
                phone: '+880 1987-654321',
                gender: 'Male',
                department: 'English',
                subject: 'English',
                status: 'pending'
            },
            {
                employeeId: 'TCH-2026-0003',
                employeeType: 'teacher',
                firstName: 'Sarah',
                lastName: 'Davis',
                email: 'sarah.davis@educonnect.com',
                phone: '+880 1122-334455',
                gender: 'Female',
                department: 'Science',
                subject: 'Biology',
                status: 'pending'
            }
        ];

        const createdTeachers = [];
        for (const teacher of teachers) {
            const registrationCode = require('crypto').randomBytes(16).toString('hex').substring(0, 12).toUpperCase();
            const employeeRecord = await EmployeeID.create({
                ...teacher,
                generatedBy: admin._id,
                registrationCode,
                codeExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
            createdTeachers.push(employeeRecord);
        }

        console.log(`Created ${createdTeachers.length} teacher employee records (pending registration)`);

        // Create Grade Configurations
        const grades = ['6', '7', '8', '9', '10'];
        const academicYear = '2025-2026';

        for (const grade of grades) {
            const sections = [];
            for (let i = 0; i < 3; i++) {
                sections.push({
                    sectionName: String.fromCharCode(65 + i), // A, B, C
                    maxStudents: 50,
                    currentStudentCount: 0,
                    isFull: false
                });
            }

            await GradeSection.create({
                grade,
                maxSections: 3,
                sections,
                academicYear,
                totalCapacity: 150, // 3 sections × 50 students
                currentEnrollment: 0
            });
        }

        console.log('Created grade configurations for grades 6-10');

        // Create a Welcome Notice
        await Notice.create({
            title: 'Welcome to Edu-Connect',
            content: 'The new school portal is officially live. We now have advanced teacher management and section assignment features!',
            author: admin._id,
            priority: 'high',
            targetRole: 'all'
        });
        console.log('Created welcome notice.');

        // Create Sample Student Profiles (not registered yet)
        const students = [
            {
                studentId: 'SIC-2026-0001',
                firstName: 'Alexander',
                lastName: 'Wright',
                dateOfBirth: new Date('2010-05-14'),
                gender: 'Male',
                bloodGroup: 'O+',
                currentClass: '7',
                section: 'A',
                rollNumber: 1,
                gpa: 3.85,
                guardianName: 'Robert Wright',
                guardianPhone: '+880 1234-567890',
                guardianEmail: 'robert.w@mail.com',
                address: '123 Avenue Road, Downtown',
                academicYear,
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0002',
                firstName: 'Sophia',
                lastName: 'Martinez',
                dateOfBirth: new Date('2010-08-22'),
                gender: 'Female',
                bloodGroup: 'B+',
                currentClass: '7',
                section: 'A',
                rollNumber: 2,
                gpa: 3.92,
                guardianName: 'Carlos Martinez',
                guardianPhone: '+880 1987-654321',
                guardianEmail: 'carlos.m@mail.com',
                address: '45 Oak Street',
                academicYear,
                status: 'active'
            },
            {
                studentId: 'SIC-2026-0003',
                firstName: 'Liam',
                lastName: 'Chen',
                dateOfBirth: new Date('2009-11-03'),
                gender: 'Male',
                bloodGroup: 'A-',
                currentClass: '8',
                section: 'B',
                rollNumber: 1,
                gpa: 3.40,
                guardianName: 'Wei Chen',
                guardianPhone: '+880 1122-334455',
                guardianEmail: 'wei.chen@mail.com',
                address: '78 Maple Ave',
                academicYear,
                status: 'active'
            }
        ];

        await StudentProfile.insertMany(students);
        console.log(`Created ${students.length} student profiles.`);

        console.log('\n✅ Database seeded successfully for mass deployment!');
        console.log('\n📚 Teacher Registration Codes (Share with teachers):');
        createdTeachers.forEach(teacher => {
            console.log(`   ${teacher.employeeId} (${teacher.firstName} ${teacher.lastName}): ${teacher.registrationCode}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Failed to seed database:', error);
        process.exit(1);
    }
}

seedDatabase();
