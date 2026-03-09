const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
    const adminUser = await User.findOne({ email: 'abc@gmail.com' });
    if (adminUser) {
        console.log(`Found user ${adminUser.email}. Role is: '${adminUser.role}'`);
    } else {
        console.log("User abc@gmail.com not found!");
    }
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
