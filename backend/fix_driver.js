const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const EmployeeID = require('./models/EmployeeID');

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'driver@educonnect.com' });
    if(user) {
        await EmployeeID.updateOne(
            { employeeId: 'EMP-BUS-01' }, 
            { $set: { user: user._id, status: 'active', email: 'driver@educonnect.com' } }
        );
        console.log('Linked existing EMP-BUS-01 to user');
    }
    process.exit();
}
fix();
