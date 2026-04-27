const mongoose = require('mongoose');
const { getAiSummary } = require('../backend/controllers/aiAssistantController');
const User = require('../backend/models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/edu-connect');
        console.log('Connected to DB');

        const user = await User.findOne({ role: 'student' });
        if (!user) {
            console.log('No student user found for testing');
            return;
        }

        const req = {
            user: user,
            query: {}
        };
        const res = {
            status: function(s) { this.statusCode = s; return this; },
            json: function(j) { console.log('Response:', JSON.stringify(j, null, 2)); }
        };

        await getAiSummary(req, res);
    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

test();
