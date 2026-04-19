const mongoose = require('mongoose');
require('dotenv').config();
const StudentProfile = require('./models/StudentProfile');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const students = await StudentProfile.find({}, 'studentId');
    console.log("Found students:", students.map(s => s.studentId));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
