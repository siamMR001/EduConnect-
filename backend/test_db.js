const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
    console.log("Connected to MongoDB Atlas!");
    console.log("Database Name:", mongoose.connection.name);

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name).join(', '));

    // Check admissions count
    const count = await mongoose.connection.db.collection('admissions').countDocuments();
    console.log("Total Admissions saved:", count);

    // Find the latest one
    const latest = await mongoose.connection.db.collection('admissions').findOne({}, { sort: { _id: -1 } });
    console.log("Latest Admission:", latest ? latest.studentId : "None found");

    process.exit(0);
}).catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
});
