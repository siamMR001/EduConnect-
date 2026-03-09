const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
    const docs = await mongoose.connection.db.collection('admissions').find({}).toArray();
    console.log("Total docs in " + mongoose.connection.name + ": ", docs.length);
    docs.forEach(d => {
        console.log(`- _id: ${d._id}, firstName: ${d.firstName}, lastName: ${d.lastName}, class: ${d.applyingForClass}, studentId: ${d.studentId}`);
    });
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
