require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('./models/User');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function inviteFriend() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database.');

        console.log('\n--- Invite a Friend ---');
        const name = await question("Enter friend's Name: ");
        const email = await question("Enter friend's Email: ");
        const password = await question('Enter a temporary Password: ');
        const role = await question('Enter Role (admin/teacher/student_guardian) [default: student_guardian]: ');

        const finalRole = role.trim() || 'student_guardian';

        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('\n❌ User with this email already exists!');
        } else {
            const newUser = await User.create({
                name,
                email,
                password,
                role: finalRole
            });
            console.log(`\n✅ Successfully invited ${newUser.name} as a ${newUser.role}!`);
            console.log(`They can now log in using email: ${newUser.email}`);
        }
    } catch (error) {
        console.error('\n❌ Error inviting friend:', error.message);
    } finally {
        await mongoose.disconnect();
        rl.close();
    }
}

inviteFriend();
