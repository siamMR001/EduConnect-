const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const EmployeeID = require('./models/EmployeeID');

const MONGO_URI = process.env.MONGODB_URI;

async function fixJaneSmith() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        const jane = await User.findOne({ email: 'teacher@educonnect.com' });
        if (!jane) {
            console.log('Jane Smith (teacher@educonnect.com) not found in Users.');
            process.exit(1);
        }

        const employeeExists = await EmployeeID.findOne({ user: jane._id });
        if (employeeExists) {
            console.log('EmployeeID record already exists for Jane Smith.');
            process.exit(0);
        }

        // Create EmployeeID record
        await EmployeeID.create({
            employeeId: 'TCH-2026-0001',
            employeeType: 'teacher',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'teacher@educonnect.com',
            user: jane._id,
            status: 'active',
            department: 'Mathematics',
            subject: 'Algebra',
            gender: 'Female',
            dateOfBirth: new Date('1985-06-15')
        });

        console.log('Successfully created EmployeeID record for Jane Smith.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing Jane Smith:', error);
        process.exit(1);
    }
}

fixJaneSmith();
