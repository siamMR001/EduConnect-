const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();
const Classroom = require('./models/Classroom');
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI).then(async () => {
    const classrooms = await Classroom.find({});
    for (const c of classrooms) {
        if (!c.leadSubject) {
            c.leadSubject = 'Core Curriculum'; // Default value to pass validation
        }
        await c.save();
    }
    console.log("Classroom validation issues fixed.");
    process.exit(0);
});
