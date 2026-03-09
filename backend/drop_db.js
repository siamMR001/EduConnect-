const mongoose = require('mongoose');
require('dotenv').config();

// Modify the connection string to point to the typo'd database
const uri = process.env.MONGODB_URI.replace('edu-connect', 'eduConnect');

mongoose.connect(uri).then(async () => {
    console.log("Connected to database:", mongoose.connection.name);
    
    // Safety check before dropping
    if (mongoose.connection.name === 'eduConnect') {
        console.log("Dropping database eduConnect...");
        await mongoose.connection.db.dropDatabase();
        console.log("Database successfully deleted!");
    } else {
        console.log("Safety Check Failed: Not targeting 'eduConnect'. Aborting.");
    }
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
