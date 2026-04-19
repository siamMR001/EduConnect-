const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const usr = await User.findOne({ email: 'KKK@gmail.com' });
    if(usr) console.log(usr.role);
    else console.log("Not found KKK@gmail.com");
    process.exit(0);
});
