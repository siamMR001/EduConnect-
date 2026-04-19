const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        console.log("Admin not found!");
        process.exit(1);
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    try {
        const res = await fetch('http://localhost:5001/api/classrooms/helpers/teachers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", data);
    } catch(e) {
        console.error("Error:", e.message);
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
