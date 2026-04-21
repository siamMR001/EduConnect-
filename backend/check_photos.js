const mongoose = require('mongoose');
require('dotenv').config();
const StudentProfile = require('./models/StudentProfile');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const students = await StudentProfile.find({}, 'studentId firstName lastName studentPhoto');
    console.log(JSON.stringify(students, null, 2));
    process.exit(0);
}

check();
