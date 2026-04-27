const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
    const users = await User.find({}, 'email role');
    console.log('Total users found:', users.length);
    users.forEach(u => console.log(`- ${u.email}: ${u.role}`));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
