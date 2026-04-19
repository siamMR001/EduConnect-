const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const EmployeeID = require('./models/EmployeeID');

const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
    const teachers = await User.find({ role: 'teacher' });
    console.log(`Found ${teachers.length} registered Users with role 'teacher'.`);
    if(teachers.length > 0) {
        teachers.forEach(t => console.log(`- ${t.name} (${t.email})`));
    }
    
    const employees = await EmployeeID.find({});
    console.log(`\nFound ${employees.length} EmployeeID records.`);
    if(employees.length > 0) {
        employees.forEach(e => console.log(`- ${e.firstName} ${e.lastName} (Type: ${e.employeeType}, Status: ${e.status})`));
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
