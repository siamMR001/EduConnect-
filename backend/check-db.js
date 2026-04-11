const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const StudentProfile = require('./models/StudentProfile');
    const existing = await StudentProfile.findOne({ studentId: '26070004' });
    console.log("Profile Exists:", !!existing);
    if(existing) console.log("Profile Data:", existing);
    process.exit(0);
}
check().catch(console.error);
