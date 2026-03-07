const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/edu-connect', { serverSelectionTimeoutMS: 2000 });
        console.log('✅ Successfully connected to MongoDB!');

        // Get all collections
        const collections = await mongoose.connection.db.collections();
        console.log('\n📁 Database Collections:');
        if (collections.length === 0) {
            console.log('  No collections found. The database is empty.');
        } else {
            for (let collection of collections) {
                const count = await collection.countDocuments();
                console.log(`  - ${collection.collectionName} (${count} documents)`);

                // Fetch up to 2 documents as examples
                if (count > 0) {
                    const docs = await collection.find({}).limit(2).toArray();
                    console.log(`    Sample data:`, JSON.stringify(docs, null, 2));
                }
            }
        }
        await mongoose.disconnect();
    } catch (error) {
        console.log('❌ Failed to connect to MongoDB.');
        console.error('Error:', error.message);
    }
}

testConnection();
